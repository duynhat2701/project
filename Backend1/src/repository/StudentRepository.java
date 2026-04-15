//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package repository;

import java.util.ArrayList;
import java.util.List;
import model.Student;

public class StudentRepository {
    private final List<Student> students = new ArrayList<>();

    public List<Student> findAll() {
        return new ArrayList<>(this.students);
    }

    public Student findById(String id) {
        return (Student)this.students.stream().filter((s) -> s.getId().equals(id)).findFirst().orElse(null);
    }

    public void save(Student student) {
        this.students.add(student);
    }

    public void delete(String id) {
        this.students.removeIf((s) -> s.getId().equals(id));
    }
}
