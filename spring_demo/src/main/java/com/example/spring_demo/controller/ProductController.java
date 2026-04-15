package com.example.spring_demo.controller;

import com.example.spring_demo.dto.ProductRequest;
import com.example.spring_demo.dto.ProductResponse;
import com.example.spring_demo.entity.Product;
import com.example.spring_demo.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4000"})
@Validated
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getAll() {
        return productService.getAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return toResponse(productService.getById(id));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
        Product product = productService.getById(id);
        byte[] imageData = product.getImageData();

        if (imageData == null || imageData.length == 0) {
            return ResponseEntity.notFound().build();
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        String contentType = product.getImageContentType();
        if (contentType != null && !contentType.isBlank()) {
            mediaType = MediaType.parseMediaType(contentType);
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, max-age=0, must-revalidate")
                .body(imageData);
    }

    @PostMapping
    public ProductResponse create(@Valid @ModelAttribute ProductRequest request) {
        Product product = productService.create(request.getName(), request.getPrice(), request.getImage());
        return toResponse(product);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @ModelAttribute ProductRequest request) {
        Product product = productService.update(id, request.getName(), request.getPrice(), request.getImage());
        return toResponse(product);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getPrice(),
                resolveImageUrl(product)
        );
    }

    private String resolveImageUrl(Product product) {
        if (product.getImageData() != null && product.getImageData().length > 0) {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/products/{id}/image")
                    .queryParam("v", buildImageVersion(product))
                    .buildAndExpand(product.getId())
                    .toUriString();
        }

        return null;
    }

    private int buildImageVersion(Product product) {
        return Objects.hash(product.getId(), product.getImageContentType(), java.util.Arrays.hashCode(product.getImageData()));
    }
}
