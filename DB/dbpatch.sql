-- Create missing columns first
ALTER TABLE MenuItem ADD COLUMN IF NOT EXISTS restaurantID INT;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS restaurantID INT;

--drop old/broken constraints to reset the state
ALTER TABLE MenuItem DROP CONSTRAINT IF EXISTS fk_menu_restaurant;
ALTER TABLE MenuItem DROP CONSTRAINT IF EXISTS fk_menu_res;
ALTER TABLE Orders DROP CONSTRAINT IF EXISTS fk_orders_restaurant;
ALTER TABLE Orders DROP CONSTRAINT IF EXISTS fk_order_res;
ALTER TABLE RestaurantManager DROP CONSTRAINT IF EXISTS unique_restaurant_id;

--assign unique IDs to any rows with NULL/Duplicate IDs
DO $$
DECLARE
    r RECORD;
    counter INT := 1;
BEGIN
    --loop through existing managers and give them a clean ID sequence
    FOR r IN SELECT userID FROM RestaurantManager ORDER BY userID LOOP
        UPDATE RestaurantManager SET restaurantID = counter WHERE userID = r.userID;
        counter := counter + 1;
    END LOOP;
END$$;

-- set not null
ALTER TABLE RestaurantManager ALTER COLUMN restaurantID SET NOT NULL;

--add the Unique Constraint 
ALTER TABLE RestaurantManager ADD CONSTRAINT unique_restaurant_id UNIQUE (restaurantID);

--convert to IDENTITY column
DO $$
DECLARE
    max_id INT;
BEGIN
    --clear any existing identity first
    ALTER TABLE RestaurantManager ALTER COLUMN restaurantID DROP IDENTITY IF EXISTS;
    
    --find the next starting number
    SELECT COALESCE(MAX(restaurantID), 99) + 1 INTO max_id FROM RestaurantManager;
    
    --apply the auto-generation rule
    EXECUTE format(
        'ALTER TABLE RestaurantManager ALTER COLUMN restaurantID ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)',
        max_id
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Identity sync skipped: %', SQLERRM;
END$$;

--relink foreign keys to the new restaurantID
ALTER TABLE MenuItem
    ADD CONSTRAINT fk_menu_restaurant
    FOREIGN KEY (restaurantID) REFERENCES RestaurantManager(restaurantID) ON DELETE CASCADE;

ALTER TABLE Orders
    ADD CONSTRAINT fk_orders_restaurant
    FOREIGN KEY (restaurantID) REFERENCES RestaurantManager(restaurantID) ON DELETE CASCADE;

--add supplemental columns if they missed them earlier
ALTER TABLE OrderItem ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(30) DEFAULT 'Cash';

DO $$ BEGIN RAISE NOTICE 'Database update successful!'; END $$;