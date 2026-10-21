require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');
const Theater = require('./models/Theater');
const Showtime = require('./models/Showtime');

const cities = ["Hyderabad", "Mumbai", "Delhi-NCR", "Bengaluru", "Chandigarh", "Ahmedabad", "Chennai", "Pune", "Kolkata", "Kochi"];

const movies = [
  {
    title: "Jailer 2 - (Telugu)",
    image: "https://image.tmdb.org/t/p/w500/p9DKeXp6FPJtAQ1k13Z4zPWrCbN.jpg",
    genre: "Action/Thriller",
    language: "Telugu",
    rating: 9.2,
    trailerUrl: "https://www.youtube.com/embed/xenOE1Tma0A",
    cities: cities
  },
  {
    title: "Dune: Part Two",
    image: "https://image.tmdb.org/t/p/w500/4gh9LSkVe1gr0Vteln1BjMIlJ07.jpg",
    genre: "Sci-Fi/Adventure",
    language: "English",
    rating: 8.8,
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    cities: cities
  },
  {
    title: "Oppenheimer",
    image: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    genre: "Biography/Drama",
    language: "English",
    rating: 9.0,
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    cities: cities
  },
  {
    title: "Leo",
    image: "https://image.tmdb.org/t/p/w500/p9DKeXp6FPJtAQ1k13Z4zPWrCbN.jpg",
    genre: "Action/Thriller",
    language: "Tamil",
    rating: 8.2,
    trailerUrl: "https://www.youtube.com/embed/Po3jStA673E",
    cities: cities
  },
  {
    title: "The Batman",
    image: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    genre: "Action/Crime",
    language: "English",
    rating: 8.5,
    trailerUrl: "https://www.youtube.com/embed/mqqft2x_Aa4",
    cities: cities
  },
  {
    title: "Barbie",
    image: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
    genre: "Comedy/Fantasy",
    language: "English",
    rating: 7.9,
    trailerUrl: "https://www.youtube.com/embed/pBk4NYhWNMM",
    cities: cities
  }
];

const theatersByCity = {
  "Hyderabad": [
    {
      name: "AMB Cinemas: Gachibowli",
      city: "Hyderabad",
      location: "Gachibowli, Hyderabad",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "Wheelchair Accessible"]
    },
    {
      name: "Prasads Multiplex: Hyderabad",
      city: "Hyderabad",
      location: "Necklace Road, Hyderabad",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "Recliner Seats"]
    },
    {
      name: "PVR: Forum Sujana Mall, Kukatpally",
      city: "Hyderabad",
      location: "Kukatpally, Hyderabad",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "Dolby Atmos"]
    },
    {
      name: "INOX: GVK One, Banjara Hills",
      city: "Hyderabad",
      location: "Banjara Hills, Hyderabad",
      cancellable: true,
      amenities: ["M-Ticket", "Food & Beverage", "4DX"]
    }
  ],
  "Mumbai": [
    {
      name: "PVR ICON: Phoenix Palladium, Lower Parel",
      city: "Mumbai",
      location: "Lower Parel, Mumbai",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "IMAX Laser"]
    },
    {
      name: "INOX: Megaplex, Inorbit Mall, Malad",
      city: "Mumbai",
      location: "Malad West, Mumbai",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "ScreenX"]
    },
    {
      name: "Cinepolis: Viviana Mall, Thane",
      city: "Mumbai",
      location: "Thane West, Mumbai",
      cancellable: true,
      amenities: ["M-Ticket", "Food & Beverage", "Dolby Atmos"]
    }
  ],
  "Bengaluru": [
    {
      name: "PVR: Vega City, Bannerghatta Road",
      city: "Bengaluru",
      location: "Bannerghatta Road, Bengaluru",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "4DX"]
    },
    {
      name: "INOX: Nexus Mall, Koramangala",
      city: "Bengaluru",
      location: "Koramangala, Bengaluru",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "IMAX"]
    }
  ],
  "Delhi-NCR": [
    {
      name: "PVR: Directors Cut, Vasant Kunj",
      city: "Delhi-NCR",
      location: "Vasant Kunj, Delhi",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "Gold Class"]
    },
    {
      name: "Cinepolis: DLF Avenue, Saket",
      city: "Delhi-NCR",
      location: "Saket, Delhi",
      cancellable: false,
      amenities: ["M-Ticket", "Food & Beverage", "4DX"]
    }
  ]
};

const showtimeTemplates = [
  { time: "11:00 AM", format: "ENG", status: "AVAILABLE", pricePremium: 350, priceExecutive: 200 },
  { time: "12:20 PM", format: "HDR BY BARCO", status: "FAST_FILLING", pricePremium: 380, priceExecutive: 220 },
  { time: "01:30 PM", format: "BARCO FLAGSHIP LASER", status: "FAST_FILLING", pricePremium: 420, priceExecutive: 250 },
  { time: "03:40 PM", format: "HDR BY BARCO", status: "FAST_FILLING", pricePremium: 380, priceExecutive: 220 },
  { time: "07:00 PM", format: "HDR BY BARCO", status: "FAST_FILLING", pricePremium: 450, priceExecutive: 280 },
  { time: "07:25 PM", format: "M D LUXE", status: "AVAILABLE", pricePremium: 400, priceExecutive: 240 },
  { time: "07:30 PM", format: "BARCO FLAGSHIP LASER", status: "FAST_FILLING", pricePremium: 450, priceExecutive: 280 },
  { time: "10:20 PM", format: "HDR BY BARCO", status: "AVAILABLE", pricePremium: 350, priceExecutive: 200 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    await Movie.deleteMany({});
    await Theater.deleteMany({});
    await Showtime.deleteMany({});

    const createdMovies = await Movie.insertMany(movies);
    console.log(`Seeded ${createdMovies.length} movies.`);

    // Seed theaters across cities
    const createdTheaters = [];
    for (const [cityName, tList] of Object.entries(theatersByCity)) {
      const inserted = await Theater.insertMany(tList);
      createdTheaters.push(...inserted);
    }
    // Also create generic theaters for other cities
    for (const c of cities) {
      if (!theatersByCity[c]) {
        const genTheaters = [
          { name: `PVR Cinemas: Central Mall, ${c}`, city: c, location: `Central, ${c}`, cancellable: false, amenities: ["M-Ticket", "Food & Beverage"] },
          { name: `INOX Multiplex: City Center, ${c}`, city: c, location: `City Center, ${c}`, cancellable: false, amenities: ["M-Ticket", "Food & Beverage", "Dolby Atmos"] }
        ];
        const inserted = await Theater.insertMany(genTheaters);
        createdTheaters.push(...inserted);
      }
    }
    console.log(`Seeded ${createdTheaters.length} theaters.`);

    // Seed showtimes for today and next 7 days for each movie & theater
    const showtimesToInsert = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + dayOffset);
      showDate.setHours(0, 0, 0, 0);

      for (const movie of createdMovies) {
        // Filter theaters for the movie's cities
        const relevantTheaters = createdTheaters.filter(t => movie.cities.includes(t.city));

        for (const theater of relevantTheaters) {
          // Add 4-7 showtimes per theater
          const count = theater.name.includes("AMB") ? 7 : (theater.name.includes("Prasads") ? 5 : 4);
          for (let i = 0; i < count; i++) {
            const template = showtimeTemplates[i % showtimeTemplates.length];
            showtimesToInsert.push({
              movieId: movie._id,
              theaterId: theater._id,
              date: showDate,
              time: template.time,
              format: template.format,
              status: template.status,
              pricePremium: template.pricePremium,
              priceExecutive: template.priceExecutive
            });
          }
        }
      }
    }

    await Showtime.insertMany(showtimesToInsert);
    console.log(`Seeded ${showtimesToInsert.length} showtimes!`);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  }
}

seed();
