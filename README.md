# Overview

The Personal Finance Manager is a web application I built to improve my skills as a software engineer while solving a real-world problem: helping individuals manage their money more effectively. The application allows users to register securely, log in, and track their finances by recording income, expenses, budgets, and savings goals. It integrates with a cloud-hosted database to ensure data is available anytime and anywhere.  

The program is simple to use:  
1. Register for an account or log in with existing credentials.  
2. Add income and expenses to keep track of daily financial activity.  
3. Create budgets and savings goals.  
4. View total income, total expenses, balances, and progress toward savings.  

My purpose for writing this software was to strengthen my understanding of full-stack development with Node.js and Express, and to gain hands-on experience using MongoDB Atlas for cloud database integration.  

<!-- [Software Demo Video](http://youtube.link.goes.here) -->

# Cloud Database

This project uses **MongoDB Atlas** as the cloud database. Atlas provides a free-tier cluster that allows me to store and retrieve application data securely over the cloud.  

### Database Structure:
- **users**: Stores user profiles with hashed passwords for authentication.  
- **transactions**: Records all income and expense entries linked to a user.  
- **budgets**: Tracks spending limits by category and time period.  
- **savings**: Stores user-defined savings goals with current and target amounts.  

CRUD operations are fully supported:
- **Create**: Add users, transactions, budgets, and savings goals.  
- **Read**: Retrieve user-specific financial records.  
- **Update**: Edit or adjust transactions, budgets, or savings.  
- **Delete**: Remove records when needed.  

# Development Environment

- **Backend**: Node.js with Express.js for routing and API development.  
- **Database**: MongoDB Atlas (NoSQL, cloud-hosted).  
- **Frontend**: EJS templates with HTML, CSS, and JavaScript.  
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing.  

I developed and tested the application using VS Code, Node.js, and MongoDB Atlas’ cloud dashboard.  

# Useful Websites

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)  
- [Node.js Documentation](https://nodejs.org/en/docs/)  
- [Express.js Guide](https://expressjs.com/)  
- [JWT.io](https://jwt.io/)  
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)  

# Future Work

- Add visual dashboards and charts for better financial insights.  
- Improve UI/UX with a modern frontend framework (React or Vue).  
- Add notifications or reminders for budgets and bills.  
- Enable multi-currency support.  
- Implement role-based access or multi-user household accounts.  