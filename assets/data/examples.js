export const exampleIds = ['fibonacci', 'bubble', 'binary', 'dfs', 'nested', 'factorial'];
const py = {
    fibonacci: `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nfor i in range(10):\n    print(fibonacci(i))`,
    bubble: `def bubble_sort(nums):\n    for i in range(len(nums)):\n        for j in range(len(nums) - i - 1):\n            if nums[j] > nums[j + 1]:\n                nums[j], nums[j + 1] = nums[j + 1], nums[j]\n    return nums\n\nprint(bubble_sort([5, 2, 9, 1, 3]))`,
    binary: `def binary_search(nums, target):\n    left = 0\n    right = len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9], 7))`,
    dfs: `def dfs(graph, node, visited):\n    if node in visited:\n        return\n    visited.add(node)\n    for neighbor in graph[node]:\n        dfs(graph, neighbor, visited)\n\ngraph = {0: [1, 2], 1: [3], 2: [], 3: []}\ndfs(graph, 0, set())`,
    nested: `def grid_pattern(rows, cols):\n    for i in range(rows):\n        for j in range(cols):\n            if (i + j) % 2 == 0:\n                print('*', end=' ')\n            else:\n                print('.', end=' ')\n        print()\n\ngrid_pattern(5, 5)`,
    factorial: `def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(6))`
};
const js = {
    fibonacci: `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\nfor (let i = 0; i < 10; i++) {\n  console.log(fibonacci(i));\n}`,
    bubble: `function bubbleSort(nums) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = 0; j < nums.length - i - 1; j++) {\n      if (nums[j] > nums[j + 1]) {\n        [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];\n      }\n    }\n  }\n  return nums;\n}\nconsole.log(bubbleSort([5, 2, 9, 1, 3]));`,
    binary: `function binarySearch(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left <= right) {\n    let mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
    dfs: `function dfs(graph, node, seen) {\n  if (seen.has(node)) return;\n  seen.add(node);\n  for (const next of graph[node]) {\n    dfs(graph, next, seen);\n  }\n}\nconst graph = {0:[1,2],1:[3],2:[],3:[]};\ndfs(graph, 0, new Set());`,
    nested: `function gridPattern(rows, cols) {\n  for (let i = 0; i < rows; i++) {\n    for (let j = 0; j < cols; j++) {\n      if ((i + j) % 2 === 0) console.log('*');\n      else console.log('.');\n    }\n  }\n}\ngridPattern(5, 5);`,
    factorial: `function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\nconsole.log(factorial(6));`
};
const typed = Object.fromEntries(Object.keys(js).map(key => [key, js[key].replace(/function (\w+)\(n\)/g, 'function $1(n: number): number')]));
const c = {
    fibonacci: `#include <stdio.h>\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\nint main() {\n    for (int i = 0; i < 10; i++) printf("%d ", fibonacci(i));\n    return 0;\n}`,
    bubble: `#include <stdio.h>\nvoid bubbleSort(int a[], int n) {\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n - i - 1; j++) {\n            if (a[j] > a[j + 1]) {\n                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;\n            }\n        }\n    }\n}`,
    binary: `int binarySearch(int a[], int n, int target) {\n    int left = 0, right = n - 1;\n    while (left <= right) {\n        int mid = (left + right) / 2;\n        if (a[mid] == target) return mid;\n        if (a[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`,
    dfs: `void dfs(int node, int graph[10][10], int seen[10], int n) {\n    if (seen[node]) return;\n    seen[node] = 1;\n    for (int i = 0; i < n; i++) {\n        if (graph[node][i]) dfs(i, graph, seen, n);\n    }\n}`,
    nested: `#include <stdio.h>\nint main() {\n    for (int i = 0; i < 8; i++) {\n        for (int j = 0; j < 8; j++) {\n            if ((i + j) % 2 == 0) printf("#");\n            else printf(".");\n        }\n        printf("\\n");\n    }\n    return 0;\n}`,
    factorial: `int factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}`
};
const cpp = { ...c };
const java = {
    fibonacci: `public class Main {\n    static int fibonacci(int n) {\n        if (n <= 1) return n;\n        return fibonacci(n - 1) + fibonacci(n - 2);\n    }\n    public static void main(String[] args) {\n        for (int i = 0; i < 10; i++) {\n            System.out.println(fibonacci(i));\n        }\n    }\n}`,
    bubble: `public class Main {\n    static void bubbleSort(int[] a) {\n        for (int i = 0; i < a.length; i++) {\n            for (int j = 0; j < a.length-i-1; j++) {\n                if (a[j] > a[j+1]) {\n                    int t=a[j]; a[j]=a[j+1]; a[j+1]=t;\n                }\n            }\n        }\n    }\n}`,
    binary: `public class Main {\n    static int binarySearch(int[] a, int target) {\n        int l=0, r=a.length-1;\n        while (l<=r) {\n            int mid=(l+r)/2;\n            if (a[mid]==target) return mid;\n            if (a[mid]<target) l=mid+1;\n            else r=mid-1;\n        }\n        return -1;\n    }\n}`,
    dfs: `public class Main {\n    static void dfs(int[][] graph, int node, boolean[] seen) {\n        if (seen[node]) return;\n        seen[node]=true;\n        for (int next: graph[node]) {\n            dfs(graph, next, seen);\n        }\n    }\n}`,
    nested: `public class Main {\n    public static void main(String[] args) {\n        for (int i=0; i<8; i++) {\n            for (int j=0; j<8; j++) {\n                if ((i+j)%2==0) System.out.print("#");\n                else System.out.print(".");\n            }\n            System.out.println();\n        }\n    }\n}`,
    factorial: `public class Main {\n    static int factorial(int n) {\n        if (n <= 1) return 1;\n        return n * factorial(n - 1);\n    }\n}`
};
export const examples = { python: py, javascript: js, typescript: typed, c, cpp, java };
