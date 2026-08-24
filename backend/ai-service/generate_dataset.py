import csv
import random
import os

locations = [
    "Ranchi", "Dhanbad", "Bokaro", "Jamshedpur", "Palamu", "Hazaribagh", 
    "Dumka", "Giridih", "Chaibasa", "Deoghar", "Koderma", "Ramgarh", 
    "Latehar", "Seraikela", "Simdega", "Lohardaga", "Pakur", "Sahebganj", 
    "Gumla", "Chatra", "Khunti", "Godda", "Jamtara", "Bistupur", "Mango", "Doranda", "Dhurwa",
    "Phusro", "Chirkunda", "Adityapur", "Jugsalai"
]

hinglish_phrases = [
    "bahut problem hai.",
    "koi sun nahi raha.",
    "please help.",
    "turant action lijiye.",
    "kab theek hoga?",
    "halat bahut kharab hai.",
    "koi dhyan nahi de raha.",
    "bohot dikkat ho rahi hai.",
    "samadhan chahiye.",
    "kab tak wait karein?",
    "mera appeal hai ki isko fix karein.",
    "koi sunwai nahi hai yahan.",
    "officials are sleeping, public pareshan hai."
]

styles = [
    "I want to report that {msg}",
    "Complaint regarding: {msg}",
    "{msg}",
    "Sir/Madam, {msg}",
    "Urgent complaint: {msg}",
    "Issue in {loc}: {msg}",
    "When will the government fix this? {msg}",
    "{msg} This is unacceptable."
]

base_templates = {
    0: [
        "Water supply disrupted for {num} days.",
        "Pani ki samasya is getting worse.",
        "No drinking water available at the municipal tap.",
        "Water pipeline burst near the main road, causing massive leakage.",
        "We are getting contaminated yellow water in our taps.",
        "The handpump in our village is broken.",
        "Severe water crisis. Tankers are not arriving on time.",
        "Low water pressure means overhead tanks remain empty.",
        "Water rationing is poorly managed.",
        "Drainage water mixing with drinking water line.",
        "No water connection despite paying the fees.",
        "Pipeline leakage is wasting thousands of liters.",
        "Jal Jeevan Mission pipes laid but no water flowing.",
        "Taps are running dry in the entire locality.",
        "The local pond is completely dried up and dirty."
    ],
    1: [
        "The primary health centre has no doctors available.",
        "Shortage of essential medicines at the sadar hospital.",
        "Ambulance service refused to come during an emergency.",
        "Hospital beds are completely full.",
        "Staff at the clinic are very rude and unhelpful.",
        "No anti-venom available at the health sub-center.",
        "Vaccination camp was cancelled without notice.",
        "The x-ray machine at the district hospital has been broken for weeks.",
        "Maternal healthcare facilities are extremely poor.",
        "Doctors are prescribing medicines from private pharmacies only.",
        "Bedsheets in the ward are dirty and blood-stained.",
        "Operation theatre lacks basic sterilization equipment.",
        "No oxygen cylinders available in the ICU.",
        "Patients are forced to sleep on the floor.",
        "Community health worker has not visited for {num} months."
    ],
    2: [
        "Farmers have not received their seed subsidy yet.",
        "Tractor rental scheme is corrupted.",
        "Irrigation canal is completely dry.",
        "Locust attack ruined the crops, need compensation.",
        "MSP for paddy is not being honored at the mandi.",
        "Fertilizer shortage is killing our harvest.",
        "The soil testing lab is closed during working hours.",
        "No cold storage facility functioning, vegetables rotting.",
        "Crop insurance claims for farmers are pending for months.",
        "Pesticides supplied are past their expiry date.",
        "Kisan Credit Card applications are being rejected without reason.",
        "PM-Kisan money not credited to bank account.",
        "Stray cattle are destroying standing crops.",
        "No electricity for agricultural pumps.",
        "Market access is blocked due to broken rural roads."
    ],
    3: [
        "The government school roof is leaking.",
        "No teachers have attended the primary school this entire week.",
        "Mid-day meal quality in school is terrible.",
        "Students haven't received their textbooks yet.",
        "Girls' toilet in high school is non-functional.",
        "Scholarship funds for students are delayed.",
        "School building is unsafe.",
        "Computer lab in school has no electricity connection.",
        "Teachers are forcing students to take private tuitions.",
        "The playground of the school has been encroached upon.",
        "Classes are overcrowded with 80+ students.",
        "No drinking water facility for kids at school.",
        "Benches are broken and students sit on the floor.",
        "School boundary wall collapsed in the rain.",
        "Para-teachers are protesting, halting all classes."
    ],
    4: [
        "Garbage has not been collected for {num} weeks.",
        "The public toilet near the bus stand is overflowing.",
        "Open drains are breeding mosquitoes.",
        "Safai karamcharis are demanding bribes.",
        "No dustbins provided in the market area.",
        "Sewage water is flooding the streets.",
        "Dead animal lying on the road, foul smell everywhere.",
        "Plastic waste burning is causing severe air pollution.",
        "The dumping ground is toxic and needs to be relocated.",
        "Door-to-door waste collection vehicle doesn't visit our lane.",
        "Medical waste from clinics is dumped in the open.",
        "Manholes are left uncovered on the main road.",
        "Swachh Bharat toilets are locked and unusable.",
        "Sewer line is blocked and backing up into houses.",
        "Garbage trucks are leaking filth onto the roads."
    ],
    5: [
        "The main road is full of huge potholes.",
        "Bridge construction has been stalled for years.",
        "Streetlights on the highway are completely broken.",
        "Bus shelter collapsed during the recent storm.",
        "No proper footpaths, pedestrians are at risk.",
        "The new community hall has cracked walls already.",
        "Railway crossing needs an overbridge urgently.",
        "Paving blocks in market were removed and never replaced.",
        "The public park is unmaintained and overrun with weeds.",
        "Drainage covers are missing on the main road.",
        "Road widening project left debris everywhere.",
        "Toll plaza is charging despite terrible road conditions.",
        "Speed breakers are completely unmarked and dangerous.",
        "Underpass gets flooded after 10 minutes of rain.",
        "Bus terminal lacks seating and basic facilities."
    ],
    6: [
        "Illegal sand mining is destroying the riverbed.",
        "Heavy deforestation happening without any checks.",
        "Factories are dumping untreated chemicals into the river.",
        "Air quality is terrible due to unregulated coal dust.",
        "Stone crushers are causing extreme noise and dust pollution.",
        "Wildlife habitat is being encroached upon by builders.",
        "The lake is completely covered in water hyacinth.",
        "Tree felling for road widening is excessive.",
        "Toxic fumes from the industrial area are making people sick.",
        "Groundwater depletion is alarming due to deep borewells.",
        "Open cast mining fires are releasing poisonous gases.",
        "Forest fires have been burning for {num} days unchecked.",
        "Illegal brick kilns operating near residential areas.",
        "Ash dyke from power plant breached, flooding fields.",
        "Rare bird sanctuary area is turned into a garbage dump."
    ],
    7: [
        "Wheelchair ramps are missing at the government office.",
        "No tactile paving for the blind at the railway station.",
        "Disability pensions have been stopped without reason.",
        "Public buses are completely inaccessible for wheelchair users.",
        "The disabled-friendly toilet at the hospital is always locked.",
        "No sign language interpreters available at the police station.",
        "Website for municipal corporation is not accessible.",
        "Special education school lacks basic facilities.",
        "Sidewalks are too narrow and blocked for disabled citizens.",
        "Elevator at the collectorate has been broken for months.",
        "Braille signage missing in public buildings.",
        "Disability certificates are being delayed by corrupt officials.",
        "Audio announcements for visually impaired are broken at the bus stand.",
        "Pedestrian crossings lack audio signals for the blind.",
        "No designated parking spots for persons with disabilities."
    ],
    8: [
        "Power cuts last for more than {num} hours daily.",
        "High voltage fluctuations ruined our appliances.",
        "The transformer blew up yesterday and hasn't been fixed.",
        "Electricity bills are highly inflated and incorrect.",
        "Dangling live wires are a serious safety hazard.",
        "No electricity connection provided to the newly built houses.",
        "Streetlights are glowing during the day wasting energy.",
        "Solar panels installed in panchayat bhavan are stolen.",
        "The substation catches fire frequently.",
        "Linemen are asking for money to fix faults.",
        "Smart meters are showing random high readings.",
        "Electric poles are leaning dangerously over houses.",
        "Voltage is so low that tubelights don't turn on.",
        "Three-phase line is broken, affecting pumps.",
        "Coal shortage is causing unannounced load shedding."
    ]
}

domains = {
    0: "Water Management",
    1: "Healthcare",
    2: "Agriculture",
    3: "Education",
    4: "Sanitation & Waste",
    5: "Infrastructure",
    6: "Environment",
    7: "Accessibility",
    8: "Energy"
}

data = []

# Generate 50 examples per class
for label in range(9):
    domain = domains[label]
    count = 0
    while count < 50:
        base = random.choice(base_templates[label])
        loc = random.choice(locations)
        num = random.randint(2, 10)
        
        style = random.choice(styles)
        msg = base.format(num=num)
        text = style.format(msg=msg, loc=loc)
        
        if "in {loc}" not in style and f"in {loc}" not in text and random.random() < 0.5:
            text = text.replace(".", f" in {loc}.")
            
        if random.random() < 0.3:
            text = f"{text} {random.choice(hinglish_phrases)}"
            
        if random.random() < 0.1:
            text = text.lower()
            
        text = text.replace("..", ".").strip()
        
        data.append([text, label, domain])
        count += 1

random.shuffle(data)

filepath = r"c:\Users\sk860\sih\backend\ai-service\domain_dataset.csv"
os.makedirs(os.path.dirname(filepath), exist_ok=True)

with open(filepath, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["text", "label", "domain"])
    for row in data:
        writer.writerow(row)

print(f"Generated {len(data)} examples.")
