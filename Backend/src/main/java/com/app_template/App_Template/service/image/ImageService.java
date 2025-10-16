package com.app_template.App_Template.service.image;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

public interface ImageService {
    String saveUserImage(Long userId, MultipartFile file) throws IOException;
    void deleteUserImage(Long userId) throws IOException;
    boolean isValidImageFile(MultipartFile file);
    String getImageUrl(Long userId, String fileName);
    
    // Metode pentru produse
    String saveProductImage(Long productId, MultipartFile file) throws IOException;
    void deleteProductImage(Long productId) throws IOException;
}
