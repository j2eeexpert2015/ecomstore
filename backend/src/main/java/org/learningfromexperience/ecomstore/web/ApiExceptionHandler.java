package org.learningfromexperience.ecomstore.web;

import org.learningfromexperience.ecomstore.order.InsufficientStockException;
import org.learningfromexperience.ecomstore.order.InvalidOrderException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

    public record FieldProblem(String field, String message) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalidFields(MethodArgumentNotValidException ex) {
        List<FieldProblem> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldProblem(e.getField(), e.getDefaultMessage()))
                .toList();
        return badRequest("Request validation failed", errors);
    }

    @ExceptionHandler(InvalidOrderException.class)
    ProblemDetail invalidOrder(InvalidOrderException ex) {
        return badRequest("Request validation failed", List.of(new FieldProblem(ex.getField(), ex.getMessage())));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ProblemDetail unreadable(Exception ex) {
        return badRequest("Malformed request", List.of());
    }

    @ExceptionHandler(InsufficientStockException.class)
    ProblemDetail insufficientStock(InsufficientStockException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "Insufficient stock; no order was created and stock is unchanged");
        pd.setTitle("Insufficient stock");
        pd.setProperty("shortages", ex.getShortages());
        return pd;
    }

    private static ProblemDetail badRequest(String detail, List<FieldProblem> errors) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        pd.setTitle("Invalid request");
        pd.setProperty("errors", errors);
        return pd;
    }
}
