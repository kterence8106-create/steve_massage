STEVE'S MASSAGE PARLOUR — PHP, MYSQL, HTML, CSS & JAVASCRIPT

INSTALLATION (XAMPP / WINDOWS)
1. Extract this folder into C:\xampp\htdocs\ so the project path is:
   C:\xampp\htdocs\steve_massage\
2. Open XAMPP Control Panel and start Apache and MySQL.
3. Visit http://localhost/phpmyadmin/
4. Click Import and select database\steve_massage.sql, then click Go.
   WARNING: this SQL file includes DROP TABLE statements. Importing it again
   can delete existing data in those tables. Back up your database first.
5. Visit http://localhost/steve_massage/

DATABASE CONNECTION
Check config/database.php. The default XAMPP settings are commonly:
host=localhost, database=steve_massage, username=root, password empty.
Adjust to match your own MySQL setup.

TECHNOLOGY
- HTML/CSS: page structure and design
- JavaScript: mobile menu, form validation, service filtering, confirmations,
  and KES price formatting
- PHP: server-side page logic, sessions, database queries
- MySQL: persistent storage

SECURITY NOTES
- Client-side JavaScript validation is for usability only. Always validate
  inputs in PHP as well.
- Change demo credentials before use and use password_hash/password_verify.
- This is a local development project; configure HTTPS and harden access before
  publishing it to the internet.
