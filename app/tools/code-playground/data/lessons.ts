import type { Lesson } from "../types/lessons"

export const lessons: Record<string, Lesson[]> = {
  JavaScript: [
    {
      id: "js-1",
      title: "Hello, World!",
      description: 'Write a program that prints "Hello, World!" to the console.',
      language: "javascript",
      initialCode: "// Write your code here\n",
      answer: 'console.log("Hello, World!");',
      tips: [
        "In JavaScript, you can use console.log() to print to the console.",
        "Remember to use quotation marks for strings.",
        "JavaScript statements often end with a semicolon (;).",
      ],
    },
    {
      id: "js-2",
      title: "Sum of Two Numbers",
      description: "Write a function that takes two numbers as parameters and returns their sum.",
      language: "javascript",
      initialCode: "function sum(a, b) {\n  // Write your code here\n}\n\nconsole.log(sum(5, 3));",
      answer: "function sum(a, b) {\n  return a + b;\n}\n\nconsole.log(sum(5, 3));",
      tips: [
        "Use the 'function' keyword to declare a function in JavaScript.",
        "Parameters are listed in parentheses after the function name.",
        "Use the 'return' keyword to specify what the function should output.",
      ],
    },
    {
      id: "js-3",
      title: "Fibonacci Sequence",
      description: "Write a function that generates the first n numbers of the Fibonacci sequence.",
      language: "javascript",
      initialCode: "function fibonacci(n) {\n  // Write your code here\n}\n\nconsole.log(fibonacci(10));",
      answer: `function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];

  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i-1] + sequence[i-2]);
  }
  return sequence;
}

console.log(fibonacci(10));`,
      tips: [
        "Start with base cases for n <= 2.",
        "Use an array to store the sequence.",
        "Each new number is the sum of the two preceding ones.",
        "Use a loop to generate the sequence up to n numbers.",
      ],
    },
    {
      id: "js-4",
      title: "Palindrome Checker",
      description: "Write a function that checks if a given string is a palindrome.",
      language: "javascript",
      initialCode:
        'function isPalindrome(str) {\n  // Write your code here\n}\n\nconsole.log(isPalindrome("racecar"));\nconsole.log(isPalindrome("hello"));',
      answer: `function isPalindrome(str) {
  const cleanStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanStr === cleanStr.split('').reverse().join('');
}

console.log(isPalindrome("racecar"));
console.log(isPalindrome("hello"));`,
      tips: [
        "Convert the string to lowercase to make the comparison case-insensitive.",
        "Remove non-alphanumeric characters for a more robust check.",
        "You can reverse a string by splitting it into an array, reversing the array, and joining it back.",
        "Compare the original string with its reversed version.",
      ],
    },
    {
      id: "js-5",
      title: "Array Manipulation",
      description:
        "Write a function that takes an array of numbers and returns a new array with only the even numbers.",
      language: "javascript",
      initialCode: `function filterEvenNumbers(numbers) {
  // Write your code here
}

console.log(filterEvenNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));`,
      answer: `function filterEvenNumbers(numbers) {
  return numbers.filter(num => num % 2 === 0);
}

console.log(filterEvenNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));`,
      tips: [
        "Use the array filter() method to create a new array with all elements that pass the test implemented by the provided function.",
        "The modulo operator % can be used to check if a number is even (num % 2 === 0).",
        "Arrow functions can make your code more concise for simple operations.",
      ],
    },
    {
      id: "js-6",
      title: "Object Manipulation",
      description:
        "Create a function that takes an object and returns a new object with all the values multiplied by 2.",
      language: "javascript",
      initialCode: `function multiplyByTwo(obj) {
  // Write your code here
}

console.log(multiplyByTwo({ a: 1, b: 2, c: 3 }));`,
      answer: `function multiplyByTwo(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value * 2])
  );
}

console.log(multiplyByTwo({ a: 1, b: 2, c: 3 }));`,
      tips: [
        "Use Object.entries() to convert the object into an array of key-value pairs.",
        "Map over the array to create a new array with the values multiplied by 2.",
        "Use Object.fromEntries() to convert the array back into an object.",
      ],
    },
  ],
  Python: [
    {
      id: "py-1",
      title: "Hello, World!",
      description: 'Write a program that prints "Hello, World!" to the console.',
      language: "python",
      initialCode: "# Write your code here\n",
      answer: 'print("Hello, World!")',
      tips: [
        "In Python, you can use the print() function to output text.",
        "Strings can be enclosed in either single or double quotes.",
        "Python doesn't use semicolons to end statements.",
      ],
    },
    {
      id: "py-2",
      title: "Sum of Two Numbers",
      description: "Write a function that takes two numbers as parameters and returns their sum.",
      language: "python",
      initialCode: "def sum(a, b):\n    # Write your code here\n\nprint(sum(5, 3))",
      answer: "def sum(a, b):\n    return a + b\n\nprint(sum(5, 3))",
      tips: [
        "Use 'def' to define a function in Python.",
        "Indentation is crucial in Python - it defines the function body.",
        "The 'return' statement specifies the function's output.",
      ],
    },
    {
      id: "py-3",
      title: "List Comprehension",
      description: "Use list comprehension to create a list of squares of even numbers from 0 to 20.",
      language: "python",
      initialCode: "# Write your code here\n\nprint(squares)",
      answer: "squares = [x**2 for x in range(21) if x % 2 == 0]\n\nprint(squares)",
      tips: [
        "List comprehension provides a concise way to create lists in Python.",
        "The basic syntax is: [expression for item in iterable if condition]",
        "Use range() to generate a sequence of numbers.",
        "The condition 'if x % 2 == 0' checks if a number is even.",
      ],
    },
    {
      id: "py-4",
      title: "Dictionary Manipulation",
      description:
        "Create a function that takes a list of strings and returns a dictionary with the strings as keys and their lengths as values.",
      language: "python",
      initialCode:
        'def string_lengths(strings):\n    # Write your code here\n\nprint(string_lengths(["hello", "world", "python"]))',
      answer: `def string_lengths(strings):
    return {s: len(s) for s in strings}

print(string_lengths(["hello", "world", "python"]))`,
      tips: [
        "You can use dictionary comprehension to create a dictionary concisely.",
        "The len() function returns the length of a string.",
        "The syntax for dictionary comprehension is: {key_expr: value_expr for item in iterable}",
        "This approach is more efficient than building the dictionary manually in a loop.",
      ],
    },
    {
      id: "py-5",
      title: "File Handling",
      description: "Write a function that reads a text file and returns the number of words in it.",
      language: "python",
      initialCode: `def count_words(filename):
    # Write your code here

# Test the function
print(count_words('sample.txt'))`,
      answer: `def count_words(filename):
    with open(filename, 'r') as file:
        content = file.read()
        words = content.split()
        return len(words)

# Test the function
print(count_words('sample.txt'))`,
      tips: [
        "Use the 'with' statement to ensure the file is properly closed after reading.",
        "The read() method reads the entire file content as a string.",
        "Split the content into words using the split() method, which by default splits on whitespace.",
        "Use len() to count the number of words in the resulting list.",
      ],
    },
    {
      id: "py-6",
      title: "Lambda Functions",
      description:
        "Use a lambda function with the map() function to convert a list of temperatures from Celsius to Fahrenheit.",
      language: "python",
      initialCode: `celsius = [0, 10, 20, 30, 40]

# Write your code here

print(fahrenheit)`,
      answer: `celsius = [0, 10, 20, 30, 40]

fahrenheit = list(map(lambda c: (c * 9/5) + 32, celsius))

print(fahrenheit)`,
      tips: [
        "Lambda functions are small anonymous functions defined with the 'lambda' keyword.",
        "The map() function applies a given function to each item in an iterable.",
        "The formula to convert Celsius to Fahrenheit is: (C * 9/5) + 32",
        "Wrap the map() function with list() to convert the result to a list for printing.",
      ],
    },
  ],
  Java: [
    {
      id: "java-1",
      title: "Hello, World!",
      description: 'Write a program that prints "Hello, World!" to the console.',
      language: "java",
      initialCode:
        "public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
      answer:
        'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      tips: [
        "In Java, every program must have a main method inside a class.",
        "Use System.out.println() to print to the console.",
        "Java statements end with a semicolon (;).",
        "Java is case-sensitive, so make sure to capitalize 'String' and 'System'.",
      ],
    },
    {
      id: "java-2",
      title: "Sum of Two Numbers",
      description: "Write a function that takes two numbers as parameters and returns their sum.",
      language: "java",
      initialCode:
        "public class Main {\n    public static int sum(int a, int b) {\n        // Write your code here\n    }\n\n    public static void main(String[] args) {\n        System.out.println(sum(5, 3));\n    }\n}",
      answer:
        "public class Main {\n    public static int sum(int a, int b) {\n        return a + b;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(sum(5, 3));\n    }\n}",
      tips: [
        "In Java, methods (functions) are defined inside classes.",
        "Specify the return type of the method before its name (e.g., 'int sum').",
        "Use 'static' for methods that don't require an instance of the class.",
        "The 'return' keyword is used to specify the method's output.",
      ],
    },
    {
      id: "java-3",
      title: "ArrayList Manipulation",
      description:
        "Create a function that takes an ArrayList of integers and returns a new ArrayList with only the even numbers.",
      language: "java",
      initialCode: `import java.util.ArrayList;
import java.util.Arrays;

public class Main {
    public static ArrayList<Integer> filterEven(ArrayList<Integer> numbers) {
        // Write your code here
    }

    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
        System.out.println(filterEven(numbers));
    }
}`,
      answer: `import java.util.ArrayList;
import java.util.Arrays;

public class Main {
    public static ArrayList<Integer> filterEven(ArrayList<Integer> numbers) {
        ArrayList<Integer> evenNumbers = new ArrayList<>();
        for (int num : numbers) {
            if (num % 2 == 0) {
                evenNumbers.add(num);
            }
        }
        return evenNumbers;
    }

    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
        System.out.println(filterEven(numbers));
    }
}`,
      tips: [
        "Use ArrayList<Integer> to create a list of integers.",
        "The enhanced for loop (for-each) can be used to iterate through an ArrayList.",
        "The modulo operator % can be used to check if a number is even (num % 2 == 0).",
        "Create a new ArrayList to store the filtered results.",
      ],
    },
    {
      id: "java-4",
      title: "String Manipulation",
      description: "Create a function that reverses a string without using the built-in reverse() method.",
      language: "java",
      initialCode: `public class Main {
    public static String reverseString(String str) {
        // Write your code here
    }

    public static void main(String[] args) {
        System.out.println(reverseString("Hello, World!"));
    }
}`,
      answer: `public class Main {
    public static String reverseString(String str) {
        StringBuilder reversed = new StringBuilder();
        for (int i = str.length() - 1; i >= 0; i--) {
            reversed.append(str.charAt(i));
        }
        return reversed.toString();
    }

    public static void main(String[] args) {
        System.out.println(reverseString("Hello, World!"));
    }
}`,
      tips: [
        "Use StringBuilder for efficient string manipulation in Java.",
        "Iterate through the string from the end to the beginning.",
        "The charAt() method can be used to access individual characters in a string.",
        "Convert the StringBuilder back to a String using toString() method.",
      ],
    },
    {
      id: "java-5",
      title: "Exception Handling",
      description:
        "Write a function that takes a string input and converts it to an integer, handling potential exceptions.",
      language: "java",
      initialCode: `public class Main {
    public static int convertToInt(String input) {
        // Write your code here
    }

    public static void main(String[] args) {
        System.out.println(convertToInt("123"));
        System.out.println(convertToInt("abc"));
    }
}`,
      answer: `public class Main {
    public static int convertToInt(String input) {
        try {
            return Integer.parseInt(input);
        } catch (NumberFormatException e) {
            System.out.println("Invalid input: " + input);
            return 0;
        }
    }

    public static void main(String[] args) {
        System.out.println(convertToInt("123"));
        System.out.println(convertToInt("abc"));
    }
}`,
      tips: [
        "Use Integer.parseInt() to convert a string to an integer.",
        "Wrap the conversion in a try-catch block to handle NumberFormatException.",
        "In the catch block, you can choose to return a default value or throw a custom exception.",
        "Always provide meaningful error messages when handling exceptions.",
      ],
    },
    {
      id: "java-6",
      title: "Interfaces and Abstract Classes",
      description:
        "Create an interface 'Shape' with an abstract method 'area()', and implement it in 'Circle' and 'Rectangle' classes.",
      language: "java",
      initialCode: `// Write your code here

public class Main {
    public static void main(String[] args) {
        Shape circle = new Circle(5);
        Shape rectangle = new Rectangle(4, 6);
        
        System.out.println("Circle area: " + circle.area());
        System.out.println("Rectangle area: " + rectangle.area());
    }
}`,
      answer: `interface Shape {
    double area();
}

class Circle implements Shape {
    private double radius;
    
    public Circle(double radius) {
        this.radius = radius;
    }
    
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

class Rectangle implements Shape {
    private double width;
    private double height;
    
    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    
    @Override
    public double area() {
        return width * height;
    }
}

public class Main {
    public static void main(String[] args) {
        Shape circle = new Circle(5);
        Shape rectangle = new Rectangle(4, 6);
        
        System.out.println("Circle area: " + circle.area());
        System.out.println("Rectangle area: " + rectangle.area());
    }
}`,
      tips: [
        "Interfaces define a contract that classes must follow, specifying method signatures without implementation.",
        "The 'implements' keyword is used when a class implements an interface.",
        "Override annotations (@Override) are used to indicate that a method is overriding a method from a superclass or interface.",
        "Math.PI can be used for precise calculations involving pi.",
      ],
    },
  ],
}

