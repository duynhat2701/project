package com.example.spring_demo.service;

import com.example.spring_demo.entity.Product;
import com.example.spring_demo.exception.ProductNotFoundException;
import com.example.spring_demo.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public Product create(String name, Integer price, MultipartFile imageFile) {
        validateImage(imageFile, true);

        Product product = new Product();
        product.setName(name);
        product.setPrice(price);
        applyImage(product, imageFile);

        return productRepository.save(product);
    }

    public Product update(Long id, String name, Integer price, MultipartFile imageFile) {
        Product product = getById(id);

        product.setName(name);
        product.setPrice(price);

        validateImage(imageFile, false);
        if (imageFile != null && !imageFile.isEmpty()) {
            applyImage(product, imageFile);
        }

        return productRepository.save(product);
    }

    public void delete(Long id) {
        getById(id);
        productRepository.deleteById(id);
    }

    private void validateImage(MultipartFile imageFile, boolean required) {
        if ((imageFile == null || imageFile.isEmpty())) {
            if (required) {
                throw new IllegalArgumentException("Image khong duoc de trong");
            }
            return;
        }

        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Chi duoc tai len file hinh anh");
        }
    }

    private void applyImage(Product product, MultipartFile imageFile) {
        try {
            product.setImageContentType(imageFile.getContentType());
            product.setImageData(imageFile.getBytes());
        } catch (IOException exception) {
            throw new IllegalArgumentException("Doc file hinh anh that bai");
        }
    }
}
