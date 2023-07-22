-- SQLite
create table products (
        id int primary key not null,
        title text not null,
        price real not null,
        description text not null,
        category text not null,
        image text not null,
        sold boolean not null,
        dateOfSale text not null)

drop table products

insert into products values (
1, 'hello world',132.23, 'hello world','hello','world',false,'hello')

select * from products where cast(strftime('%m',dateOfSale)as integer) = 2

delete from products where id=1

SELECT
    CASE 
        WHEN price >= 0 AND price < 100 THEN '0-100'
        WHEN price >= 101 AND price < 200 THEN '100-200'
        WHEN price >= 201 AND price < 300 THEN '100-200'
        WHEN price >= 301 AND price < 400 THEN '100-200'
        WHEN price >= 401 AND price < 500 THEN '100-200'
        WHEN price >= 501 AND price < 600 THEN '100-200'
        WHEN price >= 601 AND price < 700 THEN '100-200'
        WHEN price >= 701 AND price < 800 THEN '100-200'
        WHEN price >= 801 AND price < 900 THEN '100-200'
        WHEN price >= 901 THEN '901 - above'
        END AS price_range,
    COUNT(*) AS item_count
    FROM
    products
WHERE
    strftime('%m', dateOfSale) = 7
GROUP BY
    price_range;