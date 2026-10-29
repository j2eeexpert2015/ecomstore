package org.learningfromexperience.ecomstore.order;

/** An order that passed bean validation but references data that does not exist. */
public class InvalidOrderException extends RuntimeException {

    private final String field;

    public InvalidOrderException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
