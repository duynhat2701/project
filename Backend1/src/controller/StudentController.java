//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package controller;

import java.io.PrintStream;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Scanner;
import model.Student;
import service.StudentService;

public class StudentController {
    private final StudentService service;
    private final Scanner scanner;

    public StudentController(StudentService service) {
        this.scanner = new Scanner(System.in);
        this.service = service;
    }

    public void start() {
        while(true) {
            System.out.println("\n===== MENU =====");
            if (this.service.isEmpty()) {
                System.out.println(" System is empty. You must create students first!");
                System.out.println("1. Create");
                System.out.println("0. Exit");
            } else {
                System.out.println("1. Create");
                System.out.println("2. Update");
                System.out.println("3. Show All");
                System.out.println("4. Delete");
                System.out.println("0. Exit");
            }

            Integer choice = this.readInt("Choose: ");
            if (choice == null) {
                System.out.println("No input detected. Exiting program.");
                return;
            }

            if (this.service.isEmpty()) {
                switch (choice) {
                    case 0:
                        System.out.println("Bye!");
                        return;
                    case 1:
                        this.create();
                        break;
                    default:
                        System.out.println("Please create data first!");
                }
            } else {
                switch (choice) {
                    case 0:
                        System.out.println("Bye!");
                        return;
                    case 1:
                        this.create();
                        break;
                    case 2:
                        this.update();
                        break;
                    case 3:
                        this.showAll();
                        break;
                    case 4:
                        this.delete();
                        break;
                    default:
                        System.out.println("Invalid!");
                }
            }
        }
    }

    private void showAll() {
        List<Student> var10000 = this.service.getAllStudents();
        PrintStream var10001 = System.out;
        Objects.requireNonNull(var10001);
        var10000.forEach(var10001::println);
    }

    private void create() {
        Integer n = this.readInt("Enter number of students: ");
        if (n == null) {
            System.out.println("Creation cancelled.");
            return;
        }

        for(int i = 0; i < n; ++i) {
            System.out.println("\n--- Student " + (i + 1) + " ---");

            while(true) {
                System.out.print("ID: ");
                String id = this.readLine();
                if (id == null) {
                    System.out.println("Creation cancelled.");
                    return;
                }

                if (!this.service.isIdExists(id)) {
                    System.out.print("Name: ");
                    String name = this.readLine();
                    Integer age = this.readInt("Age: ");
                    Double gpa = this.readDouble("GPA: ");
                    if (name == null || age == null || gpa == null) {
                        System.out.println("Creation cancelled.");
                        return;
                    }

                    this.service.createStudent(id, name, age, gpa);
                    System.out.println("Created successfully!");
                    break;
                }

                System.out.println("ID already exists! Please enter again.");
            }
        }

    }

    private void update() {
        System.out.print("Enter ID to update: ");
        String id = this.readLine();
        if (id == null) {
            System.out.println("Update cancelled.");
            return;
        }

        if (!this.service.isIdExists(id)) {
            System.out.println(" ID not found!");
        } else {
            System.out.println("Enter new information:");
            System.out.print("New Name: ");
            String name = this.readLine();
            Integer age = this.readInt("New Age: ");
            Double gpa = this.readDouble("New GPA: ");
            if (name == null || age == null || gpa == null) {
                System.out.println("Update cancelled.");
                return;
            }

            this.service.updateStudent(id, name, age, gpa);
            System.out.println("Updated successfully!");
        }
    }

    private void delete() {
        System.out.print("ID: ");
        String id = this.readLine();
        if (id == null) {
            System.out.println("Delete cancelled.");
            return;
        }

        this.service.deleteStudent(id);
    }

    private String readLine() {
        try {
            return this.scanner.nextLine();
        } catch (NoSuchElementException e) {
            return null;
        }
    }

    private Integer readInt(String prompt) {
        while(true) {
            System.out.print(prompt);
            String value = this.readLine();
            if (value == null) {
                return null;
            }

            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid integer.");
            }
        }
    }

    private Double readDouble(String prompt) {
        while(true) {
            System.out.print(prompt);
            String value = this.readLine();
            if (value == null) {
                return null;
            }

            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid number.");
            }
        }
    }
}
