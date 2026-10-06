require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

const movies = [
  {
    title: "Jawan",
    image: "https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:ote-MDcgU2VwLCAyMDIz,ots-29,otc-FFFFFF,oy-612,ox-24:q-80/et00311714-ewdhzjgajp-portrait.jpg",
    genre: "Action/Thriller",
    language: "Hindi",
    rating: 8.5
  },
  {
    title: "Oppenheimer",
    image: "https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:ote-MjEgSnVsLCAyMDIz,ots-29,otc-FFFFFF,oy-612,ox-24:q-80/et00347867-lqxzrswmtn-portrait.jpg",
    genre: "Biography/Drama",
    language: "English",
    rating: 9.0
  },
  {
    title: "Leo",
    image: "https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:ote-MTkgT2N0LCAyMDIz,ots-29,otc-FFFFFF,oy-612,ox-24:q-80/et00351731-szwpsvdfkr-portrait.jpg",
    genre: "Action/Thriller",
    language: "Tamil",
    rating: 8.2
  },
  {
    title: "Animal",
    image: "https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:ote-MDEgRGVjLCAyMDIz,ots-29,otc-FFFFFF,oy-612,ox-24:q-80/et00311762-bmsmzbzhhx-portrait.jpg",
    genre: "Crime/Drama",
    language: "Hindi",
    rating: 8.8
  },
  {
    title: "Barbie",
    image: "https://assets-in.bmscdn.com/discovery-catalog/events/tr:w-400,h-600,bg-CCCCCC:w-400.0,h-660.0,cm-pad_resize,bg-000000,fo-top:ote-MjEgSnVsLCAyMDIz,ots-29,otc-FFFFFF,oy-612,ox-24:q-80/et00174124-xndbkjxszk-portrait.jpg",
    genre: "Comedy/Fantasy",
    language: "English",
    rating: 7.9
  }
];

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected for seeding');
  await Movie.deleteMany();
  await Movie.insertMany(movies);
  console.log('Movies seeded successfully!');
  process.exit();
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
