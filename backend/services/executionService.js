import Docker from 'dockerode';
import { spawn } from 'child_process';
import logger from '../config/logger.js';

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const docker = new Docker({ socketPath: DOCKER_SOCKET });

const LANGUAGE_IMAGES = {
  javascript: 'node:18-alpine',
  python: 'python:3.11-alpine',
  java: 'openjdk:17-alpine',
  cpp: 'gcc:12-alpine',
  c: 'gcc:12-alpine',
  go: 'golang:1.20-alpine',
  ruby: 'ruby:3.2-alpine',
  php: 'php:8.2-cli-alpine',
};

export async function executeCode(language, code) {
  const image = LANGUAGE_IMAGES[language] || LANGUAGE_IMAGES.javascript;

  try {
    // Pull image if not present
    await new Promise((resolve) => {
      docker.pull(image, (err, stream) => {
        if (err) {
          logger.warn(`Image pull failed for ${image}: ${err.message}, using cached`);
          resolve();
          return;
        }
        docker.modem.followProgress(stream, resolve);
      });
    });

    // Create container with strict resource limits
    const container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '-c', code],
      Memory: 512 * 1024 * 1024, // 512MB
      MemorySwap: 512 * 1024 * 1024,
      CpuShares: 512,
      CpuPeriod: 100000,
      CpuQuota: 50000,
      NetworkMode: 'none',
      Timeout: parseInt(process.env.EXECUTION_TIMEOUT) || 30000,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
    });

    let output = '';
    let error = '';

    // Attach stream before start to avoid losing early output
    // dockerode uses callback pattern for attach() — promisify manually
    const stream = await new Promise((resolve, reject) => {
      container.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
        if (err) reject(err);
        else resolve(stream);
      });
    });

    stream.on('data', (data) => {
      output += data.toString();
    });

    stream.on('error', (err) => {
      error += err.toString();
    });

    await container.start();

    // Wait for container to complete
    await container.wait();

    // Wait for stream to flush all buffered data before resolving
    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      const onEnd = () => {
        clearTimeout(timeout);
        resolve();
      };
      stream.once('end', onEnd);
      stream.once('close', onEnd);
    });

    // Cleanup
    await container.remove();

    return { output, error: error || null };
  } catch (err) {
    logger.error('Execution error:', err);
    return { output: '', error: err.message };
  }
}

export async function executeWithPTY(language, code, stdin, callback) {
  // For interactive terminal execution
  const proc = spawn('docker', [
    'run',
    '--rm',
    '-i',
    '--cpus=0.5',
    '--memory=512m',
    '--network=none',
    LANGUAGE_IMAGES[language] || LANGUAGE_IMAGES.javascript,
    language === 'bash' ? 'bash' : language,
  ]);

  let output = '';
  let error = '';

  proc.stdout.on('data', (data) => {
    output += data.toString();
    callback({ type: 'output', data: data.toString() });
  });

  proc.stderr.on('data', (data) => {
    error += data.toString();
    callback({ type: 'error', data: data.toString() });
  });

  proc.on('close', (code) => {
    callback({ type: 'exit', code });
  });

  if (code) {
    proc.stdin.write(code);
  }

  if (stdin) {
    proc.stdin.write(stdin);
  }

  return proc;
}