package org.learningfromexperience.ecomstore.catalog;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /** Case-insensitive substring match on name; an empty search matches every product. */
    @Query("""
            select p from Product p join fetch p.category c
            where locate(lower(:search), lower(p.name)) > 0
              and (:categoryId is null or c.id = :categoryId)
            order by p.id
            """)
    List<Product> search(@Param("search") String search, @Param("categoryId") Long categoryId);

    @Query("select p from Product p join fetch p.category where p.id in :ids")
    List<Product> findAllWithCategoryByIdIn(@Param("ids") Collection<Long> ids);

    /** Atomic conditional decrement: returns 1 when stock was sufficient, 0 otherwise. */
    @Modifying
    @Query("update Product p set p.stock = p.stock - :quantity where p.id = :id and p.stock >= :quantity")
    int decrementStockIfAvailable(@Param("id") Long id, @Param("quantity") int quantity);

    @Query("select p.stock from Product p where p.id = :id")
    int currentStock(@Param("id") Long id);
}
