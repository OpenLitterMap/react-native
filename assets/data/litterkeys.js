const LITTERKEYS = {
    smoking: [
        'butts', // Cigarette/Butts
        'lighters', // Lighters
        'cigaretteBox', // Cigarette Box
        'tobaccoPouch', // Tobacco Pouch
        'skins', // Rolling Papers
        'smoking_plastic', // Plastic Packaging
        'filters', // Filters
        'filterbox', // Filter Box
        'smokingOther', // Smoking-Other
        'vape_pen', // Vape pen
        'vape_oil' // Vape oil
    ],
    alcohol: [
        'beerBottle', // Beer Bottles
        'spiritBottle', // Spirit Bottles
        'wineBottle', // Wine Bottles
        'beerCan', // Beer Cans
        'brokenGlass', // Broken Glass
        'bottleTops', // Beer bottle tops
        'paperCardAlcoholPackaging', // Paper Packaging
        'plasticAlcoholPackaging', // Plastic Packaging
        'alcoholOther', // Alcohol-Other
        'pint', // Pint Glass
        'six_pack_rings', // Six-pack rings
        'alcohol_plastic_cups' // Plastic Cups
    ],
    coffee: [
        'coffeeCups', // Coffee Cups
        'coffeeLids', // Coffee Lids
        'coffeeOther' // Coffee-Other
    ],
    food: [
        'sweetWrappers', // Sweet Wrappers
        'paperFoodPackaging', // Paper/Cardboard Packaging
        'plasticFoodPackaging', // Plastic Packaging
        'plasticCutlery', // Plastic Cutlery
        'crisp_small', // Crisp/Chip Packet (small)
        'crisp_large', // Crisp/Chip Packet (large)
        'styrofoam_plate', // Styrofoam Plate
        'napkins', // Napkins
        'sauce_packet', // Sauce Packet
        'glass_jar', // Glass Jar
        'glass_jar_lid', // Glass Jar Lid
        'pizza_box', // Pizza Box
        'aluminium_foil', // Aluminium Foil
        'chewing_gum', // Chewing Gum
        'foodOther' // Food-other
    ],
    softdrinks: [
        'waterBottle', // Plastic Water bottle
        'fizzyDrinkBottle', // Plastic Fizzy Drink bottle
        'tinCan', // Can
        'bottleLid', // Bottle Tops
        'bottleLabel', // Bottle Labels
        'sportsDrink', // Sports Drink bottle
        'straws', // Straws
        'plastic_cups', // Plastic Cups
        'plastic_cup_tops', // Plastic Cup Tops
        'milk_bottle', // Milk Bottle
        'milk_carton', // Milk Carton
        'paper_cups', // Paper Cups
        'juice_cartons', // Juice Cartons
        'juice_bottles', // Juice Bottles
        'juice_packet', // Juice Packet
        'ice_tea_bottles', // Ice Tea Bottles
        'ice_tea_can', // Ice Tea Can
        'energy_can', // Energy Can
        'pullring', // Pull-ring
        'strawpacket', // Straw Packaging
        'styro_cup', // Styrofoam Cup
        'softDrinkOther' // Soft Drink (other)
    ],
    sanitary: [
        'gloves', // Gloves
        'facemask', // Facemask
        'condoms', // Condoms
        'nappies', // Nappies
        'menstral', // Menstral
        'deodorant', // Deodorant
        'ear_swabs', // Ear Swabs
        'tooth_pick', // Tooth Pick
        'tooth_brush', // Tooth Brush
        'wetwipes', // Wet Wipes
        'sanitaryOther', // Sanitary (other)
        'hand_sanitiser' // Hand Sanitiser
    ],
    other: [
        'random_litter', // Random Litter
        'bags_litter', // Bags of Litter
        'overflowing_bins', // Overflowing Bins
        'plastic', // Unidentifiable Plastic
        'automobile', // Automobile
        'tyre', // Tyre
        'traffic_cone', // Traffic Cone
        'metal', // Metal Object
        'plastic_bags', // Plastic Bags
        'election_posters', // Election Posters
        'forsale_posters', // For Sale Posters
        'cable_tie', // Cable tie
        'books', // Books
        'magazine', // Magazines
        'paper', // Paper
        'stationary', // Stationery
        'washing_up', // Washing-up Bottle
        'clothing', // Clothing
        'hair_tie', // Hair Tie
        'ear_plugs', // Ear Plugs (music)
        'elec_small', // Electric small
        'elec_large', // Electric large
        'batteries', // Batteries
        'balloons', // Balloons
        'life_buoy', // Life Buoy
        'other' // Other (other)
    ],
    dumping: [
        'small', // Small
        'medium', // Medium
        'large' // Large
    ],
    industrial: [
        'oil', // Oil
        'industrial_plastic', // Plastic
        'chemical', // Chemical
        'bricks', // Bricks
        'tape', // Tape
        'industrial_other' // Other
    ],
    coastal: [
        'microplastics', // Microplastics
        'mediumplastics', // Mediumplastics
        'macroplastics', // Macroplastics
        'rope_small', // Rope small
        'rope_medium', // Rope medium
        'rope_large', // Rope large
        'fishing_gear_nets', // Fishing gear/nets
        'buoys', // Buoys
        'degraded_plasticbottle', // Degraded Plastic Bottle
        'degraded_plasticbag', // Degraded Plastic Bag
        'degraded_straws', // Degraded Drinking Straws
        'degraded_lighters', // Degraded Lighters
        'balloons', // Balloons
        'lego', // Lego
        'shotgun_cartridges', // Shotgun Cartridges
        'styro_small', // Styrofoam small
        'styro_medium', // Styrofoam medium
        'styro_large', // Styrofoam large
        'coastal_other' // Coastal (other
    ],
    brands: [
        'aadrink', // AA Drink
        'adidas', // Adidas
        'albertheijn', //AlbertHeijn
        'aldi', // aldi
        'amazon', // Amazon
        'amstel', // Amstel
        'apple', // Apple
        'applegreen', // applegreen
        'asahi', // asahi
        'avoca', // avoca
        'bacardi', // Bacardi
        'ballygowan', // ballygowan
        'bewleys', // bewleys
        'brambles', // brambles
        'budweiser', // Budweiser
        'bulmers', // bulmers
        'bullit', // Bullit
        'burgerking', // burgerking
        'butlers', // butlers
        'cadburys', // cadburys
        'cafenero', // cafenero
        'camel', // Camel
        'caprisun', // Capri Sun
        'carlsberg', // carlsberg
        'centra', // centra
        'circlek', // circlek
        'coke', // Coca-Cola
        'coles', // coles
        'colgate', // Colgate
        'corona', // Corona
        'costa', // Costa
        'doritos', // Doritos
        'drpepper', // DrPepper
        'dunnes', // Dunnes
        'duracell', // Duracell
        'durex', // Durex
        'esquires', // Esquires
        'evian', // evian
        'fanta', // Fanta
        'fernandes', // Fernandes
        'fosters', // fosters
        'frank_and_honest', // Frank-and-Honest
        'fritolay', // Frito-Lay
        'gatorade', // Gatorade
        'gillette', // Gillette
        'goldenpower', // goldenpower
        'guinness', // guinness
        'haribo', // Haribo
        'heineken', // Heineken
        'hertog_jan', // Hertog Jan
        'insomnia', // Insomnia
        'kellogs', // Kellogs
        'kfc', // KFC
        'lavish', // Lavish
        'lego', // Lego
        'lidl', // Lidl
        'lindenvillage', // Lindenvillage
        'lipton', // Lipton
        'lolly_and_cookes', // Lolly-and-cookes
        'loreal', // Loreal
        'lucozade', // Lucozade
        'marlboro', // Marlboro
        'mars', // Mars
        'mcdonalds', // McDonalds
        'monster', // Monster
        'nero', // nero
        'nescafe', // Nescafe
        'nestle', // Nestle
        'nike', // Nike
        'obriens', // O-Briens
        'pepsi', // Pepsi
        'powerade', // Powerade
        'redbull', // Redbull
        'ribena', // Ribena
        'sainsburys', // Sainsburys
        'samsung', // Samsung
        'schutters', // Schutters
        'slammers', // Slammers
        'spa', // SPA
        'spar', // Spar
        'starbucks', // Starbucks
        'stella', // Stella
        'subway', // Subway
        'supermacs', // Supermacs
        'supervalu', // Supervalu
        'tayto', // Tayto
        'tesco', // Tesco
        'thins', // Thins
        'tim_hortons',
        'volvic', // Volvic
        'waitrose', // Waitrose
        'walkers', // Walkers
        'wendys',
        'wilde_and_greene', // Wilde-and-Greene
        'woolworths', // Woolworths
        'wrigleys' // Wrigley
    ],
    trashdog: [
        'trashdog', // TrashDog
        'littercat', // LitterCat
        'duck' // LitterDuc
    ],
    dogshit: [
        'poo', // Surprise!
        'poo_in_bag' // Surprise in a bag!
    ]
};
export default LITTERKEYS;
