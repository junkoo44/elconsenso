// Banco definitivo de categorías de alta rejugabilidad provisto por el usuario
// Capitalizamos la primera letra de cada palabra para máxima prolijidad visual
export const DEFAULT_CATEGORIES = [
  {
    id: "cat-1",
    nombre: "Animales",
    esPropia: false,
    palabras: [
      "Perro", "Gato", "Elefante", "Tigre", "Delfín", "Águila", "Serpiente", "Caballo", "Vaca", "Cerdo",
      "Gallina", "Pato", "Loro", "Pingüino", "Cocodrilo", "Jirafa", "Cebra", "Hipopótamo", "Rinoceronte",
      "Gorila", "Chimpancé", "Koala", "Canguro", "Oso", "Lobo", "Zorro", "Conejo", "Ratón", "Ardilla",
      "Murciélago", "Ballena", "Tiburón", "Pulpo", "Medusa", "Cangrejo", "Langosta", "Atún", "Salmón",
      "Trucha", "Rana", "Sapo", "Lagarto", "Camaleón", "Tortuga", "Avestruz", "Flamenco", "Tucán",
      "Cóndor", "Halcón", "Búho", "Abeja", "Mariposa", "Hormiga", "Araña", "Escorpión", "Ciempiés",
      "Mosca", "Mosquito", "Escarabajo", "Libélula", "León", "Leopardo", "Guepardo", "Puma", "Lince",
      "Nutria", "Foca", "Morsa", "Delfín rosado", "Ornitorrinco", "Armadillo", "Tapir",
      "Llama", "Alpaca"
    ]
  },
  {
    id: "cat-2",
    nombre: "Países",
    esPropia: false,
    palabras: [
      "Argentina", "Brasil", "Chile", "Uruguay", "Paraguay", "Bolivia", "Perú", "Colombia", "Venezuela",
      "Ecuador", "México", "Cuba", "España", "Francia", "Italia", "Alemania", "Portugal", "Inglaterra",
      "Holanda", "Bélgica", "Suiza", "Austria", "Suecia", "Noruega", "Dinamarca", "Finlandia", "Polonia",
      "Rusia", "Ucrania", "Grecia", "Turquía", "Egipto", "Marruecos", "Nigeria", "Sudáfrica", "Kenia",
      "Etiopía", "Japón", "China", "Corea", "India", "Pakistan", "Bangladesh", "Vietnam", "Tailandia",
      "Indonesia", "Australia", "Nueva Zelanda", "Canadá", "Estados Unidos", "Panamá", "Costa Rica",
      "Guatemala", "Honduras", "El Salvador", "Nicaragua", "República Dominicana", "Haití", "Jamaica",
      "Trinidad", "Irak", "Irán", "Arabia Saudita", "Jordania", "Siria", "Líbano", "Afganistán",
      "Kazajistán", "Uzbekistán", "Ghana", "Senegal", "Tanzania", "Mozambique", "Angola"
    ]
  },
  {
    id: "cat-3",
    nombre: "Comidas",
    esPropia: false,
    palabras: [
      "Pizza", "Asado", "Milanesa", "Empanada", "Sushi", "Hamburguesa", "Pasta", "Arroz", "Ensalada",
      "Sándwich", "Tacos", "Paella", "Risotto", "Lasaña", "Ravioles", "Fideos", "Polenta", "Locro",
      "Carbonada", "Puchero", "Pollo", "Churrasco", "Bife", "Costillas", "Chorizo", "Morcilla",
      "Salchicha", "Jamón", "Queso", "Huevo", "Papa", "Batata", "Mandioca", "Zapallo", "Choclo",
      "Tomate", "Lechuga", "Zanahoria", "Cebolla", "Ajo", "Sopa", "Guiso", "Estofado", "Curry",
      "Hummus", "Falafel", "Kebab", "Ramen", "Ceviche", "Dulce de leche", "Alfajor",
      "Medialunas", "Facturas", "Torta", "Helado", "Flan", "Panqueque", "Waffles", "Crepes",
      "Chocolate", "Caramelo", "Mermelada", "Mantequilla", "Yogur", "Kéfir", "Queso brie", "Mozzarella",
      "Ricota", "Provolone", "Pulpo", "Calamares", "Mejillones", "Langostinos"
    ]
  },
  {
    id: "cat-4",
    nombre: "Deportes",
    esPropia: false,
    palabras: [
      "Fútbol", "Tenis", "Básquet", "Natación", "Atletismo", "Rugby", "Vóley", "Hockey", "Béisbol",
      "Golf", "Boxeo", "Lucha", "Judo", "Karate", "Taekwondo", "Esgrima", "Tiro", "Arquería",
      "Ciclismo", "Automovilismo", "Motociclismo", "Esquí", "Snowboard", "Patinaje", "Surf",
      "Windsurf", "Remo", "Kayak", "Vela", "Polo", "Equitación", "Handball", "Waterpolo",
      "Triatlón", "Maratón", "Pentatlón", "Decatlón", "Salto alto", "Salto largo", "Lanzamiento",
      "Jabalina", "Martillo", "Pértiga", "Escalada", "Paracaidismo", "Parapente", "Alas delta",
      "Buceo", "Crossfit", "Pilates", "Yoga", "Gimnasia", "Trampolín",
      "Culturismo", "Bádminton", "Padel", "Ping pong", "Billar", "Bolos", "Dardos",
      "Ajedrez", "Bridge", "Pesca deportiva", "Senderismo", "Bmx"
    ]
  },
  {
    id: "cat-5",
    nombre: "Profesiones",
    esPropia: false,
    palabras: [
      "Médico", "Abogado", "Ingeniero", "Arquitecto", "Maestro", "Enfermero", "Contador", "Psicólogo",
      "Dentista", "Veterinario", "Programador", "Diseñador", "Periodista", "Fotógrafo", "Chef",
      "Carpintero", "Electricista", "Plomero", "Mecánico", "Albañil", "Bombero", "Policía",
      "Militar", "Piloto", "Marinero", "Taxista", "Camionero", "Ferroviario", "Repartidor", "Cajero",
      "Vendedor", "Gerente", "Director", "Economista", "Sociólogo", "Antropólogo", "Historiador",
      "Filósofo", "Lingüista", "Matemático", "Físico", "Químico", "Biólogo", "Geólogo", "Astrónomo",
      "Meteorólogo", "Agrónomo", "Forestal", "Nutricionista", "Kinesiólogo", "Fonoaudiólogo",
      "Optometrista", "Farmacéutico", "Bioquímico", "Bacteriólogo", "Cirujano", "Cardiólogo",
      "Neurólogo", "Traumatólogo", "Pediatra", "Actor", "Cantante", "Músico", "Bailarín", "Escritor",
      "Poeta", "Escultor", "Pintor", "Cineasta", "Productor", "Gasfitero", "Jardinero", "Peluquero",
      "Esteticista"
    ]
  },
  {
    id: "cat-6",
    nombre: "Lugares",
    esPropia: false,
    palabras: [
      "Playa", "Montaña", "Ciudad", "Pueblo", "Campo", "Bosque", "Selva", "Desierto", "Lago", "Río",
      "Cascada", "Volcán", "Cueva", "Isla", "Península", "Bahía", "Golfo", "Fiordo", "Llanura",
      "Meseta", "Hospital", "Escuela", "Universidad", "Biblioteca", "Museo", "Teatro", "Cine",
      "Estadio", "Parque", "Plaza", "Supermercado", "Shopping", "Mercado", "Feria", "Aeropuerto",
      "Puerto", "Estación", "Hotel", "Restaurante", "Bar", "Iglesia", "Catedral", "Mezquita",
      "Sinagoga", "Templo", "Cementerio", "Palacio", "Castillo", "Fuerte", "Ruinas", "Fábrica",
      "Oficina", "Laboratorio", "Banco", "Farmacia", "Peluquería", "Gimnasio", "Spa", "Club",
      "Casino", "Camping", "Refugio", "Faro", "Molino", "Puente", "Túnel", "Autopista", "Avenida",
      "Callejón", "Baldío", "Jardín", "Huerta", "Viñedo", "Estancia", "Laguna"
    ]
  },
  {
    id: "cat-7",
    nombre: "Objetos",
    esPropia: false,
    palabras: [
      "Silla", "Mesa", "Cama", "Armario", "Espejo", "Lámpara", "Televisor", "Heladera", "Microondas",
      "Licuadora", "Teléfono", "Computadora", "Tablet", "Auriculares", "Cámara", "Reloj", "Billetera",
      "Mochila", "Valija", "Paraguas", "Llave", "Candado", "Tijera", "Martillo", "Destornillador",
      "Llave inglesa", "Pinza", "Serrucho", "Taladro", "Nivel", "Libro", "Cuaderno", "Lapicera",
      "Lápiz", "Goma", "Regla", "Compás", "Calculadora", "Agenda", "Carpeta", "Cuchillo", "Tenedor",
      "Cuchara", "Plato", "Vaso", "Taza", "Olla", "Sartén", "Tabla", "Colador", "Jabón", "Shampoo",
      "Cepillo", "Peine", "Toalla", "Esponja", "Hilo dental", "Perfume", "Crema", "Maquillaje",
      "Pelota", "Raqueta", "Bicicleta", "Patines", "Casco", "Guantes", "Bufanda", "Gorro",
      "Cinturón", "Cartera", "Almohada", "Frazada", "Mantel", "Cuadro", "Florero"
    ]
  },
  {
    id: "cat-8",
    nombre: "Conceptos",
    esPropia: false,
    palabras: [
      "Amor", "Libertad", "Justicia", "Paz", "Guerra", "Felicidad", "Tristeza", "Miedo", "Coraje",
      "Esperanza", "Fe", "Verdad", "Mentira", "Bien", "Mal", "Belleza", "Fealdad", "Tiempo",
      "Espacio", "Infinito", "Muerte", "Vida", "Sueño", "Realidad", "Ficción", "Memoria", "Olvido",
      "Nostalgia", "Soledad", "Amistad", "Familia", "Hogar", "Patria", "Identidad", "Cultura",
      "Tradición", "Cambio", "Progreso", "Revolución", "Evolución", "Poder", "Dinero", "Riqueza",
      "Pobreza", "Igualdad", "Desigualdad", "Democracia", "Dictadura", "Religión", "Espiritualidad",
      "Naturaleza", "Tecnología", "Ciencia", "Arte", "Música", "Conocimiento", "Ignorancia",
      "Sabiduría", "Inteligencia", "Creatividad", "Esfuerzo", "Éxito", "Fracaso", "Oportunidad",
      "Riesgo", "Destino", "Azar", "Karma", "Energía", "Armonía", "Caos", "Orden", "Silencio",
      "Ruido", "Luz"
    ]
  },
  {
    id: "cat-9",
    nombre: "Marcas",
    esPropia: false,
    palabras: [
      "Nike", "Adidas", "Apple", "Samsung", "Google", "Microsoft", "Amazon", "Netflix", "Spotify",
      "YouTube", "Coca-Cola", "Pepsi", "McDonald's", "Starbucks", "KFC", "Subway",
      "Pizza Hut", "Domino's", "Rappi", "Ford", "Chevrolet", "Toyota", "Honda", "Volkswagen",
      "Bmw", "Mercedes", "Audi", "Ferrari", "Lamborghini", "Gucci", "Prada",
      "Lg", "Philips", "Panasonic", "Canon", "Nikon", "GoPro", "Xiaomi", "Huawei", "Motorola",
      "Visa", "Mastercard", "PayPal", "MercadoPago", "Banco Nación", "BBVA", "Santander", "Hsbc",
      "Galicia", "Macro", "Arcor", "Quilmes", "Fernet", "Manaos", "Cindor", "La Serenísima",
      "Marolio", "Knorr", "Hellmann's", "Unilever", "Ikea", "Falabella", "Garbarino", "Fravega",
      "Musimundo"
    ]
  }
];

const STORAGE_KEYS = {
  CATEGORIES: "consenso_categories_v5", // Cambiamos clave para forzar la carga limpia del nuevo banco masivo
  HISTORY: "consenso_history"
};

/**
 * Inicializa y recupera las categorías del LocalStorage.
 * Realiza una migración de categorías propias de la versión v1 si existen.
 */
export const getCategories = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!stored) {
      // 🚨 MIGRACIÓN DE CATEGORÍAS PROPIAS DESDE V1 🚨
      const oldStored = localStorage.getItem("consenso_categories");
      let ownCategories = [];
      if (oldStored) {
        try {
          const oldData = JSON.parse(oldStored);
          ownCategories = oldData.filter(c => c.esPropia);
          console.log(`Migradas ${ownCategories.length} categorías propias desde la v1.`);
        } catch (e) {
          console.warn("Fallo al migrar categorías v1:", e);
        }
      }

      const initialData = [...DEFAULT_CATEGORIES, ...ownCategories];
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initialData));
      return initialData;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Error leyendo categorías del localStorage:", error);
    return DEFAULT_CATEGORIES;
  }
};

/**
 * Guarda el array de categorías completo en el LocalStorage.
 */
export const saveCategories = (categories) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return true;
  } catch (error) {
    console.error("Error guardando categorías en el localStorage:", error);
    return false;
  }
};

/**
 * Restaura el banco predefinido original en el LocalStorage.
 * Mantiene las categorías propias creadas por el usuario.
 */
export const restoreDefaultCategories = () => {
  try {
    const current = getCategories();
    const ownCategories = current.filter(c => c.esPropia);
    const restored = [...DEFAULT_CATEGORIES, ...ownCategories];
    saveCategories(restored);
    return restored;
  } catch (error) {
    console.error("Error restaurando categorías por defecto:", error);
    return DEFAULT_CATEGORIES;
  }
};

/**
 * Recupera el historial de partidas guardadas.
 */
export const getHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error leyendo historial del localStorage:", error);
    return [];
  }
};

/**
 * Agrega una partida finalizada al historial.
 */
export const saveMatchToHistory = (match) => {
  try {
    const currentHistory = getHistory();
    if (match.claveUnica && currentHistory.some(m => m.claveUnica === match.claveUnica)) {
      console.log("Partida omitida en el historial local: ya estaba guardada.");
      return currentHistory;
    }
    const updatedHistory = [match, ...currentHistory];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error("Error guardando la partida en el historial:", error);
    return [];
  }
};
