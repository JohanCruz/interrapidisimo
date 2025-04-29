import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const dataSource = new DataSource({
  type: "mysql", 
  port: parseInt(process.env.DB_PORT || "3306"), // Default 3306
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "uni",
    
  synchronize: true,
  logging: false, // <--- Esto oculta las queries
  migrations: [],
  subscribers: [],
  
  // Configuración del pool de conexiones
  extra: {
    connectionLimit: 10, // Limita el número máximo de conexiones
    connectTimeout: 60000, // 60 segundos de timeout para la conexión
    acquireTimeout: 60000, // 60 segundos de timeout para adquirir una conexión
    waitForConnections: true, // Esperar a que haya conexiones disponibles
  },
});