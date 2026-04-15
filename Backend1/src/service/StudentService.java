//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package service;

import java.util.List;
import model.Student;
import repository.StudentRepository;

public class StudentService {
    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    public List<Student> getAllStudents() {
        return this.repository.findAll();
    }

    public void createStudent(String id, String name, int age, double gpa) {
        if (this.repository.findById(id) != null) {
            throw new RuntimeException("Student already exists!");
        } else {
            this.repository.save(new Student(id, name, age, gpa));
        }
    }

    public void updateStudent(String id, String name, int age, double gpa) {
        Student student = this.repository.findById(id);
        if (student == null) {
            throw new RuntimeException("Student not found!");
        } else {
            student.setName(name);
            student.setAge(age);
            student.setGpa(gpa);
        }
    }

    public void deleteStudent(String id) {
        this.repository.delete(id);
    }

    public boolean isIdExists(String id) {
        return this.repository.findById(id) != null;
    }

    public boolean isEmpty() {
        return this.repository.findAll().isEmpty();
    }
}
