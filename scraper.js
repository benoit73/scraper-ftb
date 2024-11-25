const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2');

class Modpack {
  constructor(id, name, minecraftVersion, urlImg, javaVersion) {
    this.id = id;
    this.name = name;
    this.minecraftVersion = minecraftVersion;
    this.urlImg = urlImg;
    this.javaVersion = javaVersion;
  }
}

async function scrape(id) {
  try {
    const { data } = await axios.get(`https://www.feed-the-beast.com/modpacks/${id}`);
    const $ = cheerio.load(data);

    const name = $('._modpack__packMeta__yQYbF > h2').text();
    const minecraftVersion = $('.Stat_value__5pvLP').eq(0).text();
    const urlImg = "https://www.feed-the-beast.com" + $('._modpack__logo__70kLE > img').attr('src');

    let javaVersion = null;
    $('._modpack__requirement__d8MAb > p').each((index, element) => {
        const text = $(element).text();
        if (text.includes('Java')) {
            javaVersion = $(element).find('span').text();
        }
    });



    // Retourne un nouvel objet Modpack si le nom est trouvé
    if (name) {
      return new Modpack(id, name, minecraftVersion, urlImg, javaVersion);
    }
  } catch (error) {
    console.log(`Erreur lors du scraping pour ID ${id}:`, error.message);
  }
}

async function collectModpacks() {
  const modpacksArray = [];

  // Utilisation d'une boucle pour scraper chaque ID
  for (let id = 1; id < 200; id++) {
    const modpack = await scrape(id);
    if (modpack) {
      modpacksArray.push(modpack);
    }
  }
  addModpacksInDb(modpacksArray);
}



async function addModpacksInDb(modpacksArray) {
  const connection = await createConnection();
  const preSql = await connection.execute("TRUNCATE TABLE modpacks");

    modpacksArray.forEach(modpack => {
      execute(modpack);
    });

}

async function createConnection() {
  return await mysql.createConnection({
      host: 'localhost',
      port: '3306',
      user: 'root',
      password: 'root',
      database: 'FTB'
  });
}

async function execute(modpack) {
  const connection = await createConnection();


  console.log(modpack)
  const sql = "INSERT INTO modpacks (idModpack, name, minecraftVersion, urlImg, javaVersion) VALUES (?, ?, ?, ?, ?)";
  const result = await connection.execute(sql, [modpack.id, modpack.name, modpack.minecraftVersion, modpack.urlImg, modpack.javaVersion]);
  console.log(modpack.id + ' ' + result)
}

collectModpacks();