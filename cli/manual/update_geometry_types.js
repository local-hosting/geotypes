#!/usr/bin/env node
/**
 * Script to update geometry types from polygon to point for venues, stores, and attractions.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Features that should be points (venues, stores, attractions)
const POINT_FEATURES = new Set([
    // Entertainment venues
    'theater', 'cinema', 'concert_hall', 'stadium', 'entertainment_venue',
    'casino_resort', 'standalone_casino', 'racetrack_casino', 'bingo_hall',
    'theme_park', 'arcade', 'family_entertainment', 'bowling_alley',
    
    // Retail stores
    'department_store', 'grocery_store', 'furniture_store', 'car_dealership',
    'used_car_lot', 'tire_shop',
    
    // Food & dining
    'bar', 'cafe', 'fast_food', 'deli', 'ice_cream', 'food_truck',
    'brewery', 'nightclub',
    
    // Hotels & accommodation
    'hotel', 'motel', 'resort', 'bed_breakfast', 'hostel', 'vacation_rental',
    'extended_stay', 'campground',
    
    // Sports & recreation
    'fitness_center', 'gym', 'dance_studio', 'martial_arts_studio',
    'personal_training', 'specialty_fitness', 'sports_complex',
    'baseball_field', 'basketball_court', 'football_field', 'soccer_field',
    'tennis_court', 'swimming_pool', 'ice_rink', 'golf_course',
    'playground', 'stadium',
    
    // Healthcare
    'hospital', 'medical_clinic', 'dental_office', 'veterinary_clinic',
    'urgent_care', 'rehabilitation_center', 'nursing_home',
    'mental_health_facility', 'medical_laboratory', 'medical_specialist',
    
    // Education
    'elementary_school', 'middle_school', 'high_school', 'university',
    'community_college', 'preschool', 'trade_school', 'library',
    'daycare_center',
    
    // Government & community
    'city_hall', 'courthouse', 'police_station', 'fire_station',
    'post_office', 'dmv_office', 'embassy', 'federal_building',
    'social_services', 'tax_office',
    
    // Religious & cultural
    'church', 'mosque', 'synagogue', 'temple', 'cemetery', 'museum',
    'aquarium', 'zoo', 'worship_center',
    
    // Transportation
    'airport', 'heliport', 'train_station', 'subway_station',
    'light_rail_station', 'bus_stop', 'ferry_terminal', 'port',
    'truck_stop', 'gas_station', 'charging_station',
    
    // Business & professional
    'office_building', 'coworking_space', 'bank', 'credit_union',
    'atm', 'insurance_office', 'real_estate_office', 'travel_agency',
    
    // Personal services
    'hair_salon', 'nail_salon', 'barbershop', 'spa', 'massage_therapy',
    'dry_cleaner', 'pet_grooming', 'laundromat', 'tanning_salon',
    
    // Manufacturing & industrial (smaller facilities)
    'quality_lab', 'maintenance_facility', 'workshop',
    
    // Utilities (smaller facilities)
    'cell_tower', 'radio_tower', 'utility_pole', 'fire_hydrant',
    'manhole_cover', 'water_tower', 'water_well', 'spring',
    'gas_meter', 'utility_meter', 'valve', 'pump_station',
    'transformer', 'switch_gear', 'capacitor', 'regulator',
    'junction_box', 'switching_station',
    
    // Other venues
    'movie_theater', 'retail_bank', 'savings_institution', 'lending_office',
    'brokerage_firm', 'mutual_fund_company', 'hedge_fund', 'venture_capital',
    'cryptocurrency_exchange', 'payment_processor', 'digital_bank',
    'property_casualty_insurance', 'health_insurance', 'auto_life_insurance',
    'insurance_broker', 'notary_public', 'paralegal_services',
    'senior_living', 'dormitory', 'condominium', 'apartment_building',
    'single_family_home', 'townhouse', 'mobile_home_park',
    'funeral_home', 'roundabout', 'traffic_light', 'stop_sign', 'yield_sign'
]);

function shouldBePoint(featureName) {
    return POINT_FEATURES.has(featureName);
}

function updateFeaturesInCategory(category) {
    let changes = 0;
    
    // Recursively process all subcategories and features
    function processObject(obj) {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                // Check if this is a feature with geometry_type
                if (value.geometry_type && value.name) {
                    if (value.geometry_type === 'polygon' && shouldBePoint(value.name)) {
                        console.log(`  Changing ${value.name} from polygon to point`);
                        value.geometry_type = 'point';
                        changes++;
                    }
                } else {
                    // Recursively process nested objects
                    processObject(value);
                }
            }
        }
    }
    
    processObject(category);
    return changes;
}

function updateYamlFile(filePath) {
    console.log(`Processing: ${filePath}`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        
        let totalChanges = 0;
        
        // Process each top-level category
        for (const [categoryName, categoryData] of Object.entries(data)) {
            if (typeof categoryData === 'object' && categoryData !== null) {
                const changes = updateFeaturesInCategory(categoryData);
                totalChanges += changes;
            }
        }
        
        if (totalChanges > 0) {
            const updatedContent = yaml.dump(data, { 
                lineWidth: -1, // No line wrapping
                noRefs: true,
                sortKeys: false // Preserve original order
            });
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`  Updated ${filePath} with ${totalChanges} changes`);
            return true;
        } else {
            console.log(`  No changes needed for ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`  Error processing ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    const schemaDir = path.join(__dirname, '..', 'schema');
    
    if (!fs.existsSync(schemaDir)) {
        console.error('Schema directory not found!');
        return;
    }
    
    const yamlFiles = fs.readdirSync(schemaDir)
        .filter(file => file.endsWith('.yml'))
        .map(file => path.join(schemaDir, file));
    
    console.log(`Found ${yamlFiles.length} YAML files to process`);
    
    let totalChanges = 0;
    for (const yamlFile of yamlFiles) {
        if (updateYamlFile(yamlFile)) {
            totalChanges++;
        }
    }
    
    console.log(`\nCompleted! Updated ${totalChanges} files.`);
}

if (require.main === module) {
    main();
} 