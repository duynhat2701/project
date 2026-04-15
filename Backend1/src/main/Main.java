
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)


package main;

import controller.StudentController;
import repository.StudentRepository;
import service.StudentService;

public class Main {
    public static void main(String[] args) {
        StudentRepository repository = new StudentRepository();
        StudentService service = new StudentService(repository);
        StudentController controller = new StudentController(service);
        controller.start();
    }
}
