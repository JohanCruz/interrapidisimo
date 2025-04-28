import { DataSource } from "typeorm";
import * as dotenv from "dotenv";


export const dataSource = new DataSource({
  type: "mysql",
  port: 3306,
  username: "root",
  password: "",
  database: "uni",
  //port: parseInt(process.env.DB_PORT || "3306"), // Default 3306
  //username: process.env.DB_USER || "root",
  //password: process.env.DB_PASSWORD || "",
  //database: process.env.DB_NAME || "uni",
  
  synchronize: true,
  logging: false, // <--- Esto oculta las queries
  migrations: [],
  subscribers: [],
});