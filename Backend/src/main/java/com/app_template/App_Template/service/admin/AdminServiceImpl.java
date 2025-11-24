package com.app_template.App_Template.service.admin;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.app_template.App_Template.dto.AverageCartDto;
import com.app_template.App_Template.dto.ProductDto;
import com.app_template.App_Template.dto.TopCustomerDto;
import com.app_template.App_Template.dto.UserDto;
import com.app_template.App_Template.dto.UserOrderCountDto;
import com.app_template.App_Template.entity.Order;
import com.app_template.App_Template.entity.Product;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.Role;
import com.app_template.App_Template.repository.OrderRepository;
import com.app_template.App_Template.repository.ProductRepository;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.email.EmailService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    
    @Override
    public List<UserDto> getAllUsers() {
        return this.userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() != Role.ADMIN)
                .map(User::getUserDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<UserDto> getUsersPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return this.userRepository.findByRoleNot(Role.ADMIN, pageable)
                .map(User::getUserDto);
    }

    @Override
    public void deleteUser(Long id) {
        Optional<User> user = this.userRepository.findById(id);
        if (user.isPresent()) {
            String username = user.get().getFirstname() + " " + user.get().getLastname();
            this.userRepository.delete(user.get());
            this.emailService.sendDeleteAccountEmail(user.get().getEmail(), username);
        }
        else throw new EntityNotFoundException("User not found");
    }

    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        this.emailService.sendCustomEmail(toEmail, subject, body);
    }

    @Override
    public UserDto getUserById(Long userId) {
        Optional<User> user = this.userRepository.findById(userId);
        if (user.isPresent()) {
            return user.get().getUserDto();
        }
        else throw new EntityNotFoundException("User not found");
    }

    @Override
    public Page<ProductDto> getProductsPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        return this.productRepository.findAll(pageable)
                .map(Product::getProductDto);
    }

    @Override
    public List<UserOrderCountDto> getOrdersCountByUser() {
        // Obține toate comenzile și grupează după utilizator
        List<Order> allOrders = orderRepository.findAll();
        
        Map<Long, Long> ordersByUser = allOrders.stream()
                .filter(order -> order.getUser() != null && order.getUser().getRole() != Role.ADMIN)
                .collect(Collectors.groupingBy(
                        order -> order.getUser().getId(),
                        Collectors.counting()
                ));

        return ordersByUser.entrySet().stream()
                .map(entry -> {
                    User user = userRepository.findById(entry.getKey())
                            .orElseThrow(() -> new EntityNotFoundException("User not found"));
                    return new UserOrderCountDto(
                            user.getId(),
                            user.getFirstname() + " " + user.getLastname(),
                            user.getEmail(),
                            entry.getValue()
                    );
                })
                .sorted((a, b) -> Long.compare(b.getOrderCount(), a.getOrderCount()))
                .collect(Collectors.toList());
    }

    @Override
    public List<TopCustomerDto> getTopCustomers(int limit) {
        List<Order> allOrders = orderRepository.findAll();
        
        // Grupează comenzile după utilizator și calculează totalul cheltuit
        Map<Long, Map<String, Object>> customerStats = allOrders.stream()
                .filter(order -> order.getUser() != null 
                        && order.getUser().getRole() != Role.ADMIN
                        && order.getTotalAmount() != null)
                .collect(Collectors.groupingBy(
                        order -> order.getUser().getId(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                orders -> {
                                    double totalSpent = orders.stream()
                                            .mapToDouble(Order::getTotalAmount)
                                            .sum();
                                    long orderCount = orders.size();
                                    Map<String, Object> stats = new java.util.HashMap<>();
                                    stats.put("totalSpent", totalSpent);
                                    stats.put("orderCount", orderCount);
                                    stats.put("user", orders.get(0).getUser());
                                    return stats;
                                }
                        )
                ));

        return customerStats.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> stats = entry.getValue();
                    User user = (User) stats.get("user");
                    return new TopCustomerDto(
                            user.getId(),
                            user.getFirstname() + " " + user.getLastname(),
                            user.getEmail(),
                            (Double) stats.get("totalSpent"),
                            (Long) stats.get("orderCount")
                    );
                })
                .sorted((a, b) -> Double.compare(b.getTotalSpent(), a.getTotalSpent()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public AverageCartDto getAverageCartValue() {
        List<Order> allOrders = orderRepository.findAll();
        
        List<Order> validOrders = allOrders.stream()
                .filter(order -> order.getTotalAmount() != null && order.getTotalAmount() > 0)
                .collect(Collectors.toList());

        if (validOrders.isEmpty()) {
            return new AverageCartDto(0.0, 0L, 0.0);
        }

        double totalRevenue = validOrders.stream()
                .mapToDouble(Order::getTotalAmount)
                .sum();
        
        double averageCartValue = totalRevenue / validOrders.size();
        
        return new AverageCartDto(
                Math.round(averageCartValue * 100.0) / 100.0, // Rotunjire la 2 zecimale
                (long) validOrders.size(),
                Math.round(totalRevenue * 100.0) / 100.0
        );
    }
}
