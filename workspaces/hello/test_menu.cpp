// ============================================================
//  AETHERSTUDIO RUN/DEBUG MENU TEST SUITE
//  Test every feature in the Run menu bar
// ============================================================
//
//  INSTRUCTIONS:
//   1. Open this file in the editor
//   2. Set breakpoints (F9) on lines marked [BP]
//   3. Run -> Start Debugging (F5)
//   4. Use Step Over (F10), Step Into (F11), Step Out (Shift+F11)
//   5. Watch variables and call stack in the debug panel
//   6. Try Stop (Shift+F5), Restart (Ctrl+Shift+F5)
//   7. Try Enable/Disable/Remove All Breakpoints
//   8. Try Add Configuration... to create launch.json
// ============================================================

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <cmath>
#include <cassert>
#include <stdexcept>

using namespace std;

// --- Forward declarations -----------------------------------

int factorial(int n);
int fibonacci(int n);
void printArray(const vector<int>& arr);
int calculateSum(const vector<int>& arr);
void recursiveDeep(int depth);
class Calculator;

// --- Global constants ---------------------------------------

const int MAX_DEPTH = 5;
const string GREETING = "AetherStudio Debug Test";

// ============================================================
//  Calculator class with multiple methods
//  Test: Step Into methods, Step Out back to caller
// ============================================================

class Calculator {
private:
    string name;
    vector<int> history;

public:
    Calculator(const string& name) : name(name) {}
    

    int add(int a, int b) {
        int result = a + b;          // [BP] step into here
        history.push_back(result);
        return result;
    }
   
    int multiply(int a, int b) {
        int result = 0;
        for (int i = 0; i < b; i++) {   // [BP] step over this loop
            result += a;
        }
        history.push_back(result);
        return result;
    }

    int compute(const string& op, int x, int y) {
        if (op == "add")      return add(x, y);        // [BP] step into add/multiply
        if (op == "multiply") return multiply(x, y);
        return 0;
    }

    void printHistory() const {
        cout << "  History: ";
        for (int v : history) cout << v << " ";
        cout << "\n";
    }

    int getLastResult() const {
        if (history.empty()) return -1;
        return history.back();
    }
};

// ============================================================
//  Free functions
//  Test: Step Into, Step Over, call stack inspection
// ============================================================

int factorial(int n) {
    if (n <= 1) return 1;             // [BP] base case - watch call stack depth
    return n * factorial(n - 1);       // [BP] recursive call - step into
}

int fibonacci(int n) {
    if (n <= 1) return n;              // [BP] multiple calls to step through
    return fibonacci(n - 1) + fibonacci(n - 2);
}

void printArray(const vector<int>& arr) {
    cout << "  [";
    for (size_t i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i < arr.size() - 1) cout << ", ";
    }
    cout << "]\n";
}

int calculateSum(const vector<int>& arr) {
    int sum = 0;                       // [BP] step over the loop
    for (int val : arr) {
        sum += val;                    // [BP] watch 'sum' increase
    }
    return sum;
}

// ============================================================
//  Deep recursion for call stack testing
//  Test: Step Into (stack grows), Step Out (stack unwinds)
// ============================================================

void recursiveDeep(int depth) {
    if (depth > MAX_DEPTH) {
        cout << "  Reached max depth!\n";
        return;
    }

    int localVar = depth * 10;         // [BP] watch localVar change per depth

    cout << "  Depth " << depth << ": localVar = " << localVar << "\n";

    recursiveDeep(depth + 1);          // [BP] step into - stack grows

    cout << "  Returning from depth " << depth << "\n";  // [BP] step out - stack unwinds
}

// ============================================================
//  Main entry point
//  Test: Start Debugging (F5), Stop (Shift+F5),
//        Restart (Ctrl+Shift+F5), breakpoints
// ============================================================

int main() {
    cout << "========================================\n";
    cout << "  AETHERSTUDIO DEBUG TEST SUITE\n";
    cout << "========================================\n\n";

    // 1. Calculator class - method stepping
    cout << "[1] Testing Calculator class methods:\n";
    Calculator calc("Demo");
    int r1 = calc.compute("add", 10, 20);        // [BP] step into -> compute -> add
    int r2 = calc.compute("multiply", 5, 6);     // [BP] step into -> compute -> multiply
    cout << "  add(10,20) = " << r1 << "\n";
    cout << "  multiply(5,6) = " << r2 << "\n";
    calc.printHistory();

    // 2. Recursive factorial - call stack depth
    cout << "\n[2] Testing recursion (factorial):\n";
    int fact5 = factorial(5);                     // [BP] step into -> watch stack grow
    cout << "  factorial(5) = " << fact5 << "\n";

    // 3. Fibonacci - multiple recursive calls
    cout << "\n[3] Testing fibonacci:\n";
    int fib6 = fibonacci(6);                      // [BP] more recursion with branching
    cout << "  fibonacci(6) = " << fib6 << "\n";

    // 4. Arrays and loops - stepping over
    cout << "\n[4] Testing array operations:\n";
    vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    cout << "  Numbers:";
    printArray(numbers);                          // [BP] step into void function

    int total = calculateSum(numbers);            // [BP] step over - watch return
    cout << "  Sum = " << total << "\n";

    // 5. Deep recursion - call stack inspection
    cout << "\n[5] Testing deep recursion (call stack):\n";
    cout << "  Calling recursiveDeep(1)...\n";
    recursiveDeep(1);                             // [BP] step into - watch stack
    cout << "  Done with deep recursion.\n";

    // 6. Assertions and edge cases
    cout << "\n[6] Testing edge cases:\n";
    assert(factorial(0) == 1);
    assert(factorial(1) == 1);
    assert(factorial(5) == 120);
    assert(fibonacci(0) == 0);
    assert(fibonacci(1) == 1);
    assert(fibonacci(6) == 8);
    cout << "  All assertions passed\n";

    // 7. Final output
    cout << "\n========================================\n";
    cout << "  ALL TESTS COMPLETE\n";
    cout << "========================================\n";

    int finalResult = factorial(5) + fibonacci(6);
    cout << "  Final result: " << finalResult << "\n\n";  // [BP] end - stop here

    return 0;
}
