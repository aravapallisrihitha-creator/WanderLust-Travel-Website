import java.time.*;
import java.time.format.*;
import java.util.*;

// ═══════════════════════════════════════════════════════════════════
//  WanderLust — Travel & Tour Booking System  (Console Edition)
//  Mirrors all features of the HTML app in Java
// ═══════════════════════════════════════════════════════════════════

public class WanderLust {

    // ── ANSI colours ──────────────────────────────────────────────
    static final String RESET  = "\u001B[0m";
    static final String BOLD   = "\u001B[1m";
    static final String GOLD   = "\u001B[33m";
    static final String CYAN   = "\u001B[36m";
    static final String GREEN  = "\u001B[32m";
    static final String RED    = "\u001B[31m";
    static final String YELLOW = "\u001B[33m";
    static final String BLUE   = "\u001B[34m";
    static final String MAGENTA= "\u001B[35m";
    static final String DIM    = "\u001B[2m";
    static final String WHITE  = "\u001B[97m";

    static Scanner sc = new Scanner(System.in);

    // ── In-memory stores (localStorage equivalent) ─────────────────
    static List<User>    registeredUsers = new ArrayList<>();
    static List<Booking> allBookings     = new ArrayList<>();
    static List<String>  wishlist        = new ArrayList<>();
    static List<String>  searchHistory   = new ArrayList<>();
    static List<SessionLog> adminLog     = new ArrayList<>();
    static List<SessionLog> userLog      = new ArrayList<>();

    // ── Session state ──────────────────────────────────────────────
    static User    currentUser  = null;
    static boolean isAdmin      = false;
    static String  adminEmail   = null;
    static String  adminLoginTime = null;

    static final String ADMIN_CODE = "WL-ADMIN-2025";

    // ═══════════════════════════════════════════════════════════════
    //  DATA MODELS
    // ═══════════════════════════════════════════════════════════════

    static class User {
        String name, email, password, loginTime, logoutTime;
        int trips; double points;
        boolean online;
        User(String n, String e, String p) {
            name=n; email=e; password=p;
            loginTime = now(); online = true;
            trips = 0; points = 500;
        }
    }

    static class Destination {
        String id, name, emoji, region, state;
        String[] tags, features;
        int price, seats, maxSeats;
        String duration, people, weather, temp, desc;
        Destination(String id,String name,String emoji,String region,String state,
                    String[] tags,String[] features,int price,int seats,int maxSeats,
                    String dur,String people,String weather,String temp,String desc){
            this.id=id;this.name=name;this.emoji=emoji;this.region=region;
            this.state=state;this.tags=tags;this.features=features;
            this.price=price;this.seats=seats;this.maxSeats=maxSeats;
            this.duration=dur;this.people=people;this.weather=weather;
            this.temp=temp;this.desc=desc;
        }
        String seatsLabel(){
            if(seats==0) return RED+"SOLD OUT"+RESET;
            double ratio = (double)seats/maxSeats;
            if(ratio<=0.3) return YELLOW+seats+" seats left (LOW)"+RESET;
            return GREEN+seats+" seats left"+RESET;
        }
    }

    static class Booking {
        String ref, destName, pkg, userEmail, payMethod, time;
        int amount, travellers;
        Booking(String ref,String dest,String pkg,String user,String pay,int amt,int trav){
            this.ref=ref;this.destName=dest;this.pkg=pkg;this.userEmail=user;
            this.payMethod=pay;this.amount=amt;this.travellers=trav;this.time=now();
        }
    }

    static class SessionLog {
        String name, email, loginTime, logoutTime;
        boolean isOnline;
        SessionLog(String name,String email,String login){
            this.name=name;this.email=email;this.loginTime=login;this.isOnline=true;
        }
        void logout(){ logoutTime=now(); isOnline=false; }
    }

    // ── Weather data (23 locations) ────────────────────────────────
    static String[][] weatherData = {
        {"Kerala, India",      "28°C","Humid, partly cloudy"},
        {"Ooty, India",        "18°C","Cool, misty mornings"},
        {"Manali, India",      "-2°C","Snowfall expected"},
        {"Agra, India",        "24°C","Clear skies"},
        {"Jaipur, India",      "26°C","Dry, sunny"},
        {"Andaman, India",     "30°C","Tropical, warm seas"},
        {"Ladakh, India",      " 5°C","High altitude winds"},
        {"Darjeeling, India",  "12°C","Foggy, scenic"},
        {"Goa, India",         "32°C","Beach weather perfect"},
        {"Paris, France",      "14°C","Partly cloudy, mild"},
        {"New York, USA",      " 8°C","Chilly, clear skies"},
        {"Tokyo, Japan",       "16°C","Spring bloom season"},
        {"Dubai, UAE",         "35°C","Hot & dry, sunny"},
        {"Nairobi, Kenya",     "22°C","Safari weather, clear"},
        {"Rome, Italy",        "19°C","Pleasant, light breeze"},
        {"Bali, Indonesia",    "29°C","Warm, tropical showers"},
        {"Sydney, Australia",  "23°C","Sunny, sea breeze"},
        {"Zurich, Switzerland"," 6°C","Cold, snow on peaks"},
        {"London, UK",         "11°C","Overcast, light rain"},
        {"Cancun, Mexico",     "31°C","Hot, crystal clear sea"},
        {"Bangkok, Thailand",  "33°C","Hot & humid, hazy"},
        {"Cape Town, S.Africa","20°C","Mild, breezy coast"},
        {"Barcelona, Spain",   "18°C","Warm, mostly sunny"},
    };

    // ── Destinations data ─────────────────────────────────────────
    static Destination[] destinations = {
        new Destination("kerala","Kerala","🌴","south","God's Own Country",
            new String[]{"Houseboat","Wildlife","Culture"},
            new String[]{"Houseboat Stay","Ayurvedic Spa","Spice Tour"},
            18500,12,20,"6 Days","2–8","Humid, partly cloudy","28°C",
            "Drift through emerald backwaters on a houseboat, explore spice plantations and witness Kathakali at sunset."),
        new Destination("ooty","Ooty","🌿","south","Nilgiris, Tamil Nadu",
            new String[]{"Hill Station","Nature","Tea Garden"},
            new String[]{"Toy Train Ride","Tea Factory","Botanical Garden"},
            12800,8,15,"4 Days","2–6","Cool, misty mornings","18°C",
            "Ride the iconic toy train through rolling tea estates, wake up to cool mountain mist in the Blue Mountains."),
        new Destination("manali","Manali","❄️","north","Himachal Pradesh",
            new String[]{"Snow","Adventure","Trekking"},
            new String[]{"River Rafting","Snow Activities","Rohtang Pass"},
            22000,0,12,"7 Days","2–10","Snowfall expected","-2°C",
            "Conquer the Rohtang Pass, camp under stars and feel the rush of river rafting in the icy Beas."),
        new Destination("agra","Agra","🕌","north","Uttar Pradesh",
            new String[]{"Heritage","History","Architecture"},
            new String[]{"Taj Mahal Sunrise","Agra Fort","Fatehpur Sikri"},
            9500,5,20,"3 Days","2–8","Clear skies","24°C",
            "Stand in awe before the Taj Mahal at sunrise, wander Agra Fort's labyrinthine halls."),
        new Destination("jaipur","Jaipur","🏰","north","Rajasthan",
            new String[]{"Royalty","Culture","Shopping"},
            new String[]{"Elephant Ride","City Palace","Camel Safari"},
            13500,18,25,"4 Days","2–12","Dry, sunny","26°C",
            "Ride an elephant to Amber Fort, browse dazzling bazaars and watch sunset over Nahargarh's ramparts."),
        new Destination("andaman","Andaman","🏝️","islands","Islands",
            new String[]{"Beach","Scuba Diving","Islands"},
            new String[]{"Scuba Diving","Glass Bottom Boat","Ross Island"},
            28000,0,10,"6 Days","2–6","Tropical, warm seas","30°C",
            "Snorkel through world-class coral reefs, laze on powdery white beaches and explore the Cellular Jail."),
        new Destination("ladakh","Ladakh","⛰️","north","Jammu & Kashmir",
            new String[]{"High Altitude","Monasteries","Offbeat"},
            new String[]{"Pangong Lake Camp","Monastery Tour","Zanskar Valley"},
            32000,4,10,"8 Days","2–8","High altitude winds","5°C",
            "Traverse moonscapes at 17,000 ft, meditate in ancient cliff monasteries and camp beside Pangong Tso."),
        new Destination("darjeeling","Darjeeling","☕","east","West Bengal",
            new String[]{"Tea","Mountain View","Heritage"},
            new String[]{"Tea Plantation Walk","Toy Train","Tiger Hill Sunrise"},
            15500,10,16,"5 Days","2–6","Foggy, scenic","12°C",
            "Sip first-flush Darjeeling tea while Kangchenjunga glows at dawn, ride the beloved toy train."),
        new Destination("goa","Goa","🌊","west","Goa",
            new String[]{"Beach","Nightlife","Culture"},
            new String[]{"Beach Shacks","Water Sports","Old Goa Churches"},
            14000,3,20,"5 Days","2–10","Beach weather perfect","32°C",
            "Party at beach shacks, explore Portuguese churches at dawn and cruise through mangroves with dolphins."),
    };

    // ── Google accounts ────────────────────────────────────────────
    static String[][] googleAccounts = {
        {"Arjun Sharma",  "arjun.sharma@gmail.com"},
        {"Priya Menon",   "priya.menon2024@gmail.com"},
        {"Rahul Verma",   "rahul.v.work@gmail.com"},
    };
    static String[][] appleAccounts = {
        {"Arjun Sharma",  "arjun.sharma@icloud.com"},
        {"Priya Menon",   "p.menon@me.com"},
    };

    // ── Payment methods ────────────────────────────────────────────
    static String[] payMethods = {"UPI (PhonePe / GPay / Paytm)", "Credit / Debit Card", "Net Banking", "Wallets"};

    // ═══════════════════════════════════════════════════════════════
    //  UTILITIES
    // ═══════════════════════════════════════════════════════════════

    static String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy · HH:mm"));
    }

    static String generateRef() {
        return "BK" + (System.currentTimeMillis() % 100000);
    }

    static void pause() { try { Thread.sleep(600); } catch(Exception e){} }
    static void shortPause() { try { Thread.sleep(250); } catch(Exception e){} }

    static void line()  { System.out.println(DIM+"─".repeat(60)+RESET); }
    static void dline() { System.out.println(GOLD+"═".repeat(60)+RESET); }

    static void header(String title) {
        System.out.println();
        dline();
        System.out.printf("%s%s%s  %s%s%s%n", BOLD, GOLD, "  ✈  WanderLust", WHITE, title, RESET);
        dline();
    }

    static void section(String title) {
        System.out.println();
        System.out.println(CYAN + BOLD + "  ┌─ " + title + " " + "─".repeat(Math.max(0,48-title.length())) + RESET);
    }

    static void success(String msg) { System.out.println(GREEN + "  ✔  " + msg + RESET); }
    static void error(String msg)   { System.out.println(RED   + "  ✘  " + msg + RESET); }
    static void info(String msg)    { System.out.println(CYAN  + "  ℹ  " + msg + RESET); }
    static void gold(String msg)    { System.out.println(GOLD  + "  ★  " + msg + RESET); }
    static void warn(String msg)    { System.out.println(YELLOW+ "  ⚠  " + msg + RESET); }

    static String input(String prompt) {
        System.out.print(GOLD + "  → " + RESET + prompt + ": ");
        return sc.nextLine().trim();
    }

    static int choose(String prompt, int max) {
        while(true) {
            String raw = input(prompt + " (1–" + max + ")");
            try {
                int n = Integer.parseInt(raw);
                if(n >= 1 && n <= max) return n;
            } catch(NumberFormatException ignored){}
            error("Enter a number between 1 and " + max);
        }
    }

    static void printRupees(int amount) {
        System.out.printf("%s₹%,d%s", GOLD, amount, RESET);
    }

    static void loadingBar(String msg) {
        System.out.print("  " + msg + " ");
        String[] spin = {"|","/"," -","\\"};
        for(int i=0;i<12;i++){
            System.out.print(GOLD + spin[i%4] + RESET + "\b\b");
            try { Thread.sleep(120); } catch(Exception e){}
        }
        System.out.println(GREEN + " ✔" + RESET);
    }

    static boolean isValidEmail(String e) { return e.contains("@") && e.contains("."); }
    static boolean isValidPassword(String p) { return p.length() >= 8; }
    static boolean isValidName(String n) { return n.trim().length() >= 2; }

    // ═══════════════════════════════════════════════════════════════
    //  MAIN ENTRY
    // ═══════════════════════════════════════════════════════════════

    public static void main(String[] args) {
        splashScreen();
        while(true) {
            if(currentUser == null && !isAdmin) {
                authMenu();
            } else if(isAdmin) {
                adminMenu();
            } else {
                userMenu();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  SPLASH SCREEN
    // ═══════════════════════════════════════════════════════════════

    static void splashScreen() {
        System.out.println("\n\n");
        System.out.println(GOLD + BOLD);
        System.out.println("  ██╗    ██╗ █████╗ ███╗   ██╗██████╗ ███████╗██████╗ ");
        System.out.println("  ██║    ██║██╔══██╗████╗  ██║██╔══██╗██╔════╝██╔══██╗");
        System.out.println("  ██║ █╗ ██║███████║██╔██╗ ██║██║  ██║█████╗  ██████╔╝");
        System.out.println("  ██║███╗██║██╔══██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗");
        System.out.println("  ╚███╔███╔╝██║  ██║██║ ╚████║██████╔╝███████╗██║  ██║");
        System.out.println("   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝");
        System.out.println(RESET);
        System.out.println(WHITE + BOLD + "          L U S T" + RESET);
        System.out.println(DIM + "       Travel & Tour Booking System" + RESET);
        System.out.println(DIM + "          Console Edition  v2.1.0" + RESET);
        System.out.println();
        System.out.println(CYAN + "       9+ Destinations  ·  2K+ Travellers  ·  ⭐ 4.9" + RESET);
        System.out.println();
        loadingBar("  Starting WanderLust");
        pause();
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 1 — AUTH MENU
    // ═══════════════════════════════════════════════════════════════

    static void authMenu() {
        header("AUTH — Get Started");
        System.out.println(CYAN+"  Your journey begins here.\n"+RESET);
        System.out.println("  " + BOLD + "1." + RESET + "  Create Account");
        System.out.println("  " + BOLD + "2." + RESET + "  Sign In");
        System.out.println("  " + BOLD + "3." + RESET + "  Continue with Google");
        System.out.println("  " + BOLD + "4." + RESET + "  Continue with Apple");
        System.out.println("  " + BOLD + "5." + RESET + "  Exit");
        System.out.println();
        int ch = choose("Choose", 5);
        switch(ch) {
            case 1 -> createAccountMenu();
            case 2 -> signInMenu();
            case 3 -> googleLogin();
            case 4 -> appleLogin();
            case 5 -> { System.out.println(GOLD+"\n  Safe travels! Goodbye. ✈\n"+RESET); System.exit(0); }
        }
    }

    // ── Create Account ─────────────────────────────────────────────
    static void createAccountMenu() {
        header("CREATE ACCOUNT");
        System.out.println("  " + BOLD + "1." + RESET + "  User Account");
        System.out.println("  " + BOLD + "2." + RESET + "  Admin Account");
        System.out.println("  " + BOLD + "3." + RESET + "  Back");
        int ch = choose("Role", 3);
        if(ch == 1) createUser();
        else if(ch == 2) createAdmin();
    }

    static void createUser() {
        section("New User Registration");
        System.out.println();

        // Full Name
        String name = "";
        while(!isValidName(name)) {
            name = input("Full Name");
            if(!isValidName(name)) error("Please enter your full name (min 2 characters).");
        }
        // Email
        String email = "";
        while(!isValidEmail(email)) {
            email = input("Email Address");
            if(!isValidEmail(email)) error("Please enter a valid email (e.g. you@example.com).");
        }
        // Check duplicate
        final String finalEmail = email;
        if(registeredUsers.stream().anyMatch(u -> u.email.equals(finalEmail))) {
            error("An account with this email already exists. Please sign in.");
            return;
        }
        // Password
        String pass = "";
        while(!isValidPassword(pass)) {
            pass = input("Password (min 8 characters)");
            if(!isValidPassword(pass)) error("Password must be at least 8 characters.");
            else showPasswordStrength(pass);
        }
        // Captcha
        if(!captchaCheck()) return;

        // Register
        User u = new User(name, email, pass);
        registeredUsers.add(u);
        currentUser = u;
        isAdmin = false;

        SessionLog sl = new SessionLog(name, email, u.loginTime);
        userLog.add(0, sl);

        loadingBar("  Creating your account");
        success("Welcome to WanderLust, " + BOLD + name + RESET + GREEN + "!");
        gold("You have been awarded 500 Gold Points as a welcome bonus.");
        pause();
        userMenu();
    }

    static void createAdmin() {
        section("Admin Access Setup");
        System.out.println(YELLOW + "  Admin credentials required.\n" + RESET);

        // Admin email
        String email = "";
        while(!isValidEmail(email)) {
            email = input("Admin Email");
            if(!isValidEmail(email)) error("Please enter a valid email address.");
        }
        // Admin password
        String pass = "";
        while(!isValidPassword(pass)) {
            pass = input("Admin Password (min 8 characters)");
            if(!isValidPassword(pass)) error("Password must be at least 8 characters.");
        }
        // Code reveal
        System.out.println();
        System.out.println(GOLD + "  ┌─────────────────────────────────────┐");
        System.out.println("  │      🔑  ADMIN ACCESS CODE            │");
        System.out.println("  │                                       │");
        System.out.println("  │       " + BOLD + "WL-ADMIN-2025" + RESET + GOLD + "                │");
        System.out.println("  │                                       │");
        System.out.println("  │   Enter the code below to verify      │");
        System.out.println("  └─────────────────────────────────────┘" + RESET);
        System.out.println();

        // Code entry
        String code = "";
        while(!code.equals(ADMIN_CODE)) {
            code = input("Enter Admin Code").toUpperCase();
            if(!code.equals(ADMIN_CODE)) error("Invalid admin code. Please check and try again.");
        }
        // Captcha
        if(!captchaCheck()) return;

        // Activate admin session
        adminEmail = email;
        adminLoginTime = now();
        isAdmin = true;
        currentUser = null;

        SessionLog sl = new SessionLog("Admin", email, adminLoginTime);
        adminLog.add(0, sl);

        loadingBar("  Verifying admin credentials");
        success("Admin access granted! Welcome, " + BOLD + email + RESET + GREEN + ".");
        pause();
        adminMenu();
    }

    // ── Sign In ────────────────────────────────────────────────────
    static void signInMenu() {
        section("Sign In");
        System.out.println();

        String email = "";
        while(!isValidEmail(email)) {
            email = input("Email Address");
            if(!isValidEmail(email)) error("Please enter a valid email address.");
        }
        String pass = input("Password");
        if(pass.isEmpty()) { error("Password is required."); return; }

        // Captcha
        if(!captchaCheck()) return;

        // Check registered users
        final String fe = email, fp = pass;
        Optional<User> found = registeredUsers.stream()
            .filter(u -> u.email.equals(fe) && u.password.equals(fp)).findFirst();

        if(found.isPresent()) {
            currentUser = found.get();
            currentUser.loginTime = now();
            currentUser.online = true;

            SessionLog sl = new SessionLog(currentUser.name, currentUser.email, currentUser.loginTime);
            userLog.add(0, sl);

            loadingBar("  Signing you in");
            success("Welcome back, " + BOLD + currentUser.name + RESET + GREEN + "!");
            pause();
            userMenu();
        } else {
            error("No account found with those credentials. Please create an account or try again.");
        }
    }

    // ── Google Login ───────────────────────────────────────────────
    static void googleLogin() {
        header("CONTINUE WITH GOOGLE");
        System.out.println(BLUE + "  Choose a Google account:\n" + RESET);
        for(int i=0;i<googleAccounts.length;i++) {
            System.out.printf("  %s%d.%s  %-20s  %s%s%s%n",
                BOLD, i+1, RESET, googleAccounts[i][0], DIM, googleAccounts[i][1], RESET);
        }
        System.out.println("  " + BOLD + (googleAccounts.length+1) + "." + RESET + "  Use another account");
        System.out.println("  " + BOLD + (googleAccounts.length+2) + "." + RESET + "  Back");
        int ch = choose("Select", googleAccounts.length+2);
        if(ch <= googleAccounts.length) {
            loginAsGoogleUser(googleAccounts[ch-1][0], googleAccounts[ch-1][1]);
        } else if(ch == googleAccounts.length+1) {
            String e = input("Enter your Google email");
            if(isValidEmail(e)) {
                String name = e.split("@")[0].replace(".", " ").replace("_", " ");
                name = Character.toUpperCase(name.charAt(0)) + name.substring(1);
                loginAsGoogleUser(name, e);
            } else error("Invalid email address.");
        }
    }

    static void loginAsGoogleUser(String name, String email) {
        loadingBar("  Connecting to Google");
        User u = new User(name, email, "google-auth");
        registeredUsers.removeIf(x -> x.email.equals(email));
        registeredUsers.add(u);
        currentUser = u;
        isAdmin = false;

        SessionLog sl = new SessionLog(name, email, u.loginTime);
        userLog.add(0, sl);

        success("Signed in as " + BOLD + name + RESET + GREEN + " via Google.");
        pause();
    }

    // ── Apple Login ────────────────────────────────────────────────
    static void appleLogin() {
        header("CONTINUE WITH APPLE");
        System.out.println(WHITE + "  Choose an Apple account:\n" + RESET);
        for(int i=0;i<appleAccounts.length;i++) {
            System.out.printf("  %s%d.%s  %-20s  %s%s%s%n",
                BOLD, i+1, RESET, appleAccounts[i][0], DIM, appleAccounts[i][1], RESET);
        }
        System.out.println("  " + BOLD + (appleAccounts.length+1) + "." + RESET + "  Back");
        int ch = choose("Select", appleAccounts.length+1);
        if(ch <= appleAccounts.length) {
            loadingBar("  Connecting to Apple ID");
            String name = appleAccounts[ch-1][0], email = appleAccounts[ch-1][1];
            User u = new User(name, email, "apple-auth");
            registeredUsers.removeIf(x -> x.email.equals(email));
            registeredUsers.add(u);
            currentUser = u;
            isAdmin = false;

            SessionLog sl = new SessionLog(name, email, u.loginTime);
            userLog.add(0, sl);

            success("Signed in as " + BOLD + name + RESET + GREEN + " via Apple.");
            pause();
        }
    }

    // ── Captcha ────────────────────────────────────────────────────
    static boolean captchaCheck() {
        System.out.println();
        System.out.println(DIM + "  ┌──────────────────────────────┐");
        System.out.println("  │  [ ] I'm not a robot  🔒     │");
        System.out.println("  └──────────────────────────────┘" + RESET);
        String ans = input("Type 'yes' to verify you are not a robot");
        if(ans.equalsIgnoreCase("yes")) {
            success("Captcha verified.");
            return true;
        }
        error("Captcha verification failed. Please try again.");
        return false;
    }

    // ── Password Strength ──────────────────────────────────────────
    static void showPasswordStrength(String pass) {
        int score = 0;
        if(pass.length() >= 8) score++;
        if(pass.matches(".*[A-Z].*")) score++;
        if(pass.matches(".*[0-9].*")) score++;
        if(pass.matches(".*[^A-Za-z0-9].*")) score++;
        String[] labels = {"","Weak","Fair","Strong","Very Strong"};
        String[] colors = {"",RED,YELLOW,CYAN,GREEN};
        System.out.println("  Password Strength: " + colors[score] + BOLD + labels[score] + RESET);
    }

    // ═══════════════════════════════════════════════════════════════
    //  USER MENU — Main app navigation
    // ═══════════════════════════════════════════════════════════════

    static void userMenu() {
        while(true) {
            header("MAIN MENU");
            System.out.println(DIM + "  Logged in as: " + GOLD + currentUser.name + DIM +
                "   ·   Points: " + GOLD + (int)currentUser.points + DIM +
                "   ·   Trips: " + GOLD + currentUser.trips + RESET);
            System.out.println();
            System.out.println("  " + BOLD + "1." + RESET + "  🏠  Home");
            System.out.println("  " + BOLD + "2." + RESET + "  🗺️  Destinations");
            System.out.println("  " + BOLD + "3." + RESET + "  ✈️  Packages");
            System.out.println("  " + BOLD + "4." + RESET + "  ❤️  My Wishlist  (" + wishlist.size() + " saved)");
            System.out.println("  " + BOLD + "5." + RESET + "  👤  My Profile");
            System.out.println("  " + BOLD + "6." + RESET + "  🌤️  Weather Ticker");
            System.out.println("  " + BOLD + "7." + RESET + "  🚪  Sign Out");
            System.out.println();
            int ch = choose("Navigate", 7);
            switch(ch) {
                case 1 -> homePage();
                case 2 -> destinationsPage();
                case 3 -> packagesPage();
                case 4 -> wishlistPage();
                case 5 -> profilePage();
                case 6 -> weatherTickerPage();
                case 7 -> { doLogout(); return; }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 2 — HOME
    // ═══════════════════════════════════════════════════════════════

    static void homePage() {
        header("HOME — Welcome to WanderLust");
        System.out.println();
        System.out.println(GOLD + BOLD + "  Your Journey, Perfectly Crafted." + RESET);
        System.out.println(DIM + "  Discover India's most breathtaking destinations" + RESET);
        System.out.println(DIM + "  with curated tour packages and seamless bookings." + RESET);
        System.out.println();

        section("Platform Stats");
        System.out.println();
        System.out.printf("  %s9+%s  Destinations    %s2K+%s  Travellers    %s4.9★%s  Rating%n",
            GOLD, RESET, GOLD, RESET, GOLD, RESET);

        section("Why WanderLust?");
        System.out.println();
        String[][] features = {
            {"✈️","Curated Packages","Handpicked itineraries by expert travel designers"},
            {"💳","Secure Payments","UPI, Net Banking, Cards — zero hidden fees"},
            {"🏨","Premium Stays","Boutique hotels balancing comfort and character"},
            {"📱","Real-Time Updates","Live seat availability & instant confirmations"},
            {"🗺️","9 Destinations","Kerala, Ooty, Manali, Agra, Jaipur, Andaman, Ladakh, Darjeeling, Goa"},
            {"🔒","Flexible Booking","Easy cancellations, date changes, group discounts"},
        };
        for(String[] f : features) {
            System.out.printf("  %s%s%s  %-20s %s%s%s%n", GOLD, f[0], RESET, f[1], DIM, f[2], RESET);
        }

        section("Featured Destinations");
        System.out.println();
        for(Destination d : destinations) {
            System.out.printf("  %s %s%-12s%s %s₹%,d%s/person%n",
                d.emoji, BOLD, d.name, RESET, GOLD, d.price, RESET);
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 3 — DESTINATIONS
    // ═══════════════════════════════════════════════════════════════

    static void destinationsPage() {
        while(true) {
            header("DESTINATIONS");
            System.out.println("  " + BOLD + "1." + RESET + "  Browse All Destinations");
            System.out.println("  " + BOLD + "2." + RESET + "  Search Destination");
            System.out.println("  " + BOLD + "3." + RESET + "  Filter by Type");
            System.out.println("  " + BOLD + "4." + RESET + "  Filter by Region");
            System.out.println("  " + BOLD + "5." + RESET + "  🌤️  Weather Ticker");
            System.out.println("  " + BOLD + "6." + RESET + "  Back");
            System.out.println();
            int ch = choose("Choose", 6);
            switch(ch) {
                case 1 -> browseDestinations(Arrays.asList(destinations));
                case 2 -> searchDestination();
                case 3 -> filterByType();
                case 4 -> filterByRegion();
                case 5 -> weatherTickerPage();
                case 6 -> { return; }
            }
        }
    }

    static void browseDestinations(List<Destination> list) {
        header("ALL DESTINATIONS (" + list.size() + ")");
        System.out.println();
        if(list.isEmpty()) { warn("No destinations match your filter."); input("Press Enter"); return; }
        for(int i=0;i<list.size();i++) {
            Destination d = list.get(i);
            System.out.printf("  %s%d.%s %s %s%-12s%s  %s₹%,d%s  %s  %s%n",
                BOLD, i+1, RESET,
                d.emoji, BOLD, d.name, RESET,
                GOLD, d.price, RESET,
                d.seatsLabel(),
                DIM + d.duration + RESET);
        }
        System.out.println("  " + BOLD + (list.size()+1) + "." + RESET + "  Back");
        System.out.println();
        int ch = choose("View destination", list.size()+1);
        if(ch <= list.size()) destDetailView(list.get(ch-1));
    }

    static void destDetailView(Destination d) {
        header("DESTINATION — " + d.emoji + " " + d.name);
        System.out.println();
        System.out.println(GOLD + BOLD + "  " + d.name + " — " + d.state + RESET);
        System.out.println(DIM + "  " + d.desc + RESET);
        System.out.println();

        section("Details");
        System.out.printf("  %-18s %s₹%,d/person%s%n",       "Price:",    GOLD, d.price, RESET);
        System.out.printf("  %-18s %s%s%s%n",                "Duration:", CYAN, d.duration, RESET);
        System.out.printf("  %-18s %s%s%s%n",                "Group:",    CYAN, d.people + " people", RESET);
        System.out.printf("  %-18s %s%n",                    "Seats:",    d.seatsLabel());
        System.out.printf("  %-18s %s%s%s%n",                "Weather:",  CYAN, d.temp + " · " + d.weather, RESET);

        section("Highlights");
        System.out.println();
        for(String f : d.features) System.out.println("  " + GREEN + "✔" + RESET + "  " + f);

        section("Tags");
        System.out.println();
        System.out.print("  ");
        for(String t : d.tags) System.out.print(CYAN + "[" + t + "] " + RESET);
        System.out.println();

        System.out.println();
        System.out.println("  " + BOLD + "1." + RESET + "  Book This Trip");
        System.out.println("  " + BOLD + "2." + RESET + (wishlist.contains(d.id) ? "  💛 Remove from Wishlist" : "  🤍 Add to Wishlist"));
        System.out.println("  " + BOLD + "3." + RESET + "  Back");
        int ch = choose("Action", 3);
        if(ch == 1) bookingFlow(d, null);
        else if(ch == 2) toggleWishlist(d);
    }

    static void searchDestination() {
        section("Search Destinations");
        System.out.println();
        String query = input("Search any destination (e.g. Shimla, Varanasi, Goa)").toLowerCase().trim();
        if(query.isEmpty()) return;

        // Check known destinations
        Optional<Destination> known = Arrays.stream(destinations)
            .filter(d -> d.id.contains(query) || d.name.toLowerCase().contains(query))
            .findFirst();

        if(known.isPresent()) {
            success("Found: " + known.get().name);
            destDetailView(known.get());
        } else {
            // Custom destination
            String cap = Character.toUpperCase(query.charAt(0)) + query.substring(1);
            if(!searchHistory.contains(cap)) searchHistory.add(0, cap);

            int price = 8500 + (query.hashCode() & 0xFF) % 13000;
            int seats = 3 + (query.hashCode() & 0xF) % 13;
            String seatLabel = seats <= 4 ? YELLOW + seats + " seats — LOW" + RESET : GREEN + seats + " seats available" + RESET;

            System.out.println();
            System.out.println(GOLD + "  ┌─ Search Result ─────────────────────────────────┐" + RESET);
            System.out.printf("  │  %s%s%-30s%s                 │%n", BOLD, WHITE, cap, RESET);
            System.out.printf("  │  %s📍 India — Custom Destination%s                   │%n", DIM, RESET);
            System.out.printf("  │  Tags: Sightseeing · Culture · Photography       │%n");
            System.out.printf("  │  Price: %s₹%,d/person%s                              │%n", GOLD, price, RESET);
            System.out.printf("  │  Seats: %-40s│%n", seatLabel + "          ");
            System.out.println(GOLD + "  └────────────────────────────────────────────────────┘" + RESET);
            System.out.println();
            System.out.println("  " + BOLD + "1." + RESET + "  Add to Packages & Book");
            System.out.println("  " + BOLD + "2." + RESET + "  Back");
            int ch = choose("Action", 2);
            if(ch == 1) {
                Destination custom = new Destination(
                    "custom-"+query, cap, "🗺️", "custom", "India",
                    new String[]{"Sightseeing","Culture","Photography"},
                    new String[]{"Expert Guide","Hotel Stay","Local Cuisine"},
                    price, seats, seats+5, "5 Days", "2–8", "Check locally", "N/A",
                    "Curated tour for " + cap + ". Our experts craft a personalised itinerary just for you.");
                bookingFlow(custom, null);
            }
        }
    }

    static void filterByType() {
        section("Filter by Destination Type");
        System.out.println();
        String[][] types = {
            {"beach",    "🏖️ Beach destinations"},
            {"mountain", "⛰️ Mountain destinations"},
            {"heritage", "🏛️ Heritage destinations"},
            {"nature",   "🌿 Nature destinations"},
        };
        for(int i=0;i<types.length;i++)
            System.out.println("  " + BOLD + (i+1) + "." + RESET + "  " + types[i][1]);
        System.out.println("  " + BOLD + (types.length+1) + "." + RESET + "  Back");
        int ch = choose("Filter", types.length+1);
        if(ch <= types.length) {
            String type = types[ch-1][0];
            List<Destination> filtered = new ArrayList<>();
            for(Destination d : destinations) {
                for(String t : d.tags) if(t.toLowerCase().contains(type)) { filtered.add(d); break; }
                // extra matching
                if(type.equals("beach") && (d.id.equals("goa")||d.id.equals("andaman"))) { if(!filtered.contains(d)) filtered.add(d); }
                if(type.equals("mountain") && (d.id.equals("manali")||d.id.equals("ladakh")||d.id.equals("ooty")||d.id.equals("darjeeling"))) { if(!filtered.contains(d)) filtered.add(d); }
                if(type.equals("heritage") && (d.id.equals("agra")||d.id.equals("jaipur"))) { if(!filtered.contains(d)) filtered.add(d); }
                if(type.equals("nature") && (d.id.equals("kerala")||d.id.equals("ooty"))) { if(!filtered.contains(d)) filtered.add(d); }
            }
            // remove duplicates
            List<Destination> unique = new ArrayList<>(new LinkedHashSet<>(filtered));
            browseDestinations(unique);
        }
    }

    static void filterByRegion() {
        section("Filter by Region");
        System.out.println();
        String[] regions = {"north","south","east","west","islands"};
        String[] labels  = {"🏔️ North India","🌴 South India","🍵 East India","🌊 West India","🏝️ Islands"};
        for(int i=0;i<labels.length;i++) System.out.println("  " + BOLD + (i+1) + "." + RESET + "  " + labels[i]);
        System.out.println("  " + BOLD + (labels.length+1) + "." + RESET + "  Back");
        int ch = choose("Region", labels.length+1);
        if(ch <= labels.length) {
            String r = regions[ch-1];
            List<Destination> filtered = new ArrayList<>();
            for(Destination d : destinations) if(d.region.equals(r)) filtered.add(d);
            browseDestinations(filtered);
        }
    }

    static void toggleWishlist(Destination d) {
        if(wishlist.contains(d.id)) {
            wishlist.remove(d.id);
            warn("Removed " + d.name + " from your wishlist.");
        } else {
            wishlist.add(d.id);
            success("Added " + d.name + " to your wishlist! ❤️");
        }
        shortPause();
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 4 — PACKAGES
    // ═══════════════════════════════════════════════════════════════

    static void packagesPage() {
        header("PACKAGES");
        List<Destination> list = Arrays.asList(destinations);
        System.out.println("  " + BOLD + "1." + RESET + "  Browse All Packages");
        System.out.println("  " + BOLD + "2." + RESET + "  Filter by Region");
        System.out.println("  " + BOLD + "3." + RESET + "  Back");
        int ch = choose("Choose", 3);
        if(ch == 1) packageGrid(list);
        else if(ch == 2) { filterByRegion(); }
    }

    static void packageGrid(List<Destination> list) {
        header("ALL PACKAGES");
        System.out.println();
        for(int i=0;i<list.size();i++) {
            Destination d = list.get(i);
            String priceMMT = String.format("₹%,d", (int)(d.price*1.09));
            String priceCT  = String.format("₹%,d", (int)(d.price*1.06));
            System.out.println("  " + GOLD + "─".repeat(56) + RESET);
            System.out.printf("  %s%d.%s %s %s%-14s%s  %s•%s %s%n",
                BOLD, i+1, RESET, d.emoji, BOLD, d.name + " Package", RESET, CYAN, RESET, d.duration);
            System.out.printf("     Price: %s₹%,d%s/person    MMT: %s%s%s  ClearTrip: %s%s%s%n",
                GOLD, d.price, RESET, DIM, priceMMT, RESET, DIM, priceCT, RESET);
            System.out.printf("     Seats: %-30s  Group: %s%n", d.seatsLabel(), d.people);
            System.out.printf("     Features: %s%s%s%n", DIM,
                String.join(" · ", d.features), RESET);
        }
        System.out.println("  " + GOLD + "─".repeat(56) + RESET);
        System.out.println("  " + BOLD + (list.size()+1) + "." + RESET + "  Back");
        System.out.println();
        int ch = choose("Select package to book", list.size()+1);
        if(ch <= list.size()) bookingFlow(list.get(ch-1), null);
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGES 5+6 — PAYMENT + CONFIRMATION
    // ═══════════════════════════════════════════════════════════════

    static void bookingFlow(Destination d, Object unused) {
        if(d.seats == 0) {
            error(d.name + " is SOLD OUT. Please choose another destination.");
            input("Press Enter");
            return;
        }

        // ── Payment Page ──
        header("PAYMENT — " + d.emoji + " " + d.name);
        System.out.println();

        // Travellers
        int maxTrav = 10;
        String[] travParts = d.people.split("–");
        try { maxTrav = Integer.parseInt(travParts[travParts.length-1].trim()); } catch(Exception e){}
        int trav = 0;
        while(trav < 1 || trav > Math.min(maxTrav, d.seats)) {
            String raw = input("Number of travellers (1–" + Math.min(maxTrav, d.seats) + ")");
            try { trav = Integer.parseInt(raw); } catch(NumberFormatException e){}
            if(trav < 1 || trav > Math.min(maxTrav, d.seats))
                error("Enter between 1 and " + Math.min(maxTrav, d.seats));
        }
        int total = d.price * trav;

        section("Booking Summary");
        System.out.println();
        System.out.printf("  %-20s %s%s%s%n", "Destination:", BOLD, d.name, RESET);
        System.out.printf("  %-20s %s%n", "Package:", d.duration + " — " + String.join(", ", d.features));
        System.out.printf("  %-20s %d traveller%s x ", "Travellers:", trav, trav>1?"s":"");
        printRupees(d.price); System.out.println();
        System.out.printf("  %-20s ", "Total:");
        printRupees(total); System.out.println();

        section("Choose Payment Method");
        System.out.println();
        for(int i=0;i<payMethods.length;i++)
            System.out.println("  " + BOLD + (i+1) + "." + RESET + "  " + payMethods[i]);
        System.out.println();
        int pm = choose("Payment method", payMethods.length);
        String method = payMethods[pm-1];

        // Extra fields for Card
        if(pm == 2) {
            System.out.println();
            info("Card Details");
            input("Card Number (16 digits)");
            input("Card Holder Name");
            input("Expiry (MM/YY)");
            input("CVV");
        } else if(pm == 1) {
            System.out.println();
            System.out.println("  " + BOLD + "1." + RESET + " PhonePe   " + BOLD + "2." + RESET + " Google Pay   " + BOLD + "3." + RESET + " Paytm   " + BOLD + "4." + RESET + " BHIM");
            choose("Select UPI app", 4);
            input("Enter UPI ID (e.g. name@upi)");
        } else if(pm == 3) {
            System.out.println();
            System.out.println("  " + BOLD + "1." + RESET + " SBI   " + BOLD + "2." + RESET + " HDFC   " + BOLD + "3." + RESET + " ICICI   " + BOLD + "4." + RESET + " Axis");
            choose("Select Bank", 4);
        }

        System.out.println();
        loadingBar("  Processing payment of ₹" + String.format("%,d", total));
        System.out.println();

        // ── Confirmation Page ──
        String ref = generateRef();
        header("BOOKING CONFIRMED! 🎉");
        System.out.println();
        System.out.println(GREEN + "  ╔═══════════════════════════════════════════════════╗");
        System.out.println("  ║          ✈  BOOKING CONFIRMATION  ✈             ║");
        System.out.println("  ╠═══════════════════════════════════════════════════╣");
        System.out.printf("  ║  Reference:   %-35s║%n", ref);
        System.out.printf("  ║  Destination: %-35s║%n", d.emoji + " " + d.name);
        System.out.printf("  ║  Package:     %-35s║%n", d.duration + " Tour");
        System.out.printf("  ║  Travellers:  %-35s║%n", trav + " person" + (trav>1?"s":""));
        System.out.printf("  ║  Amount Paid: %-35s║%n", "₹" + String.format("%,d", total) + " via " + method.split(" ")[0]);
        System.out.printf("  ║  Date:        %-35s║%n", now());
        System.out.println("  ╚═══════════════════════════════════════════════════╝" + RESET);
        System.out.println();

        // Confetti animation
        confettiAnimation();

        // Save booking
        Booking b = new Booking(ref, d.name, d.duration + " — " + d.name + " Package",
            currentUser.email, method, total, trav);
        allBookings.add(0, b);
        d.seats = Math.max(0, d.seats - trav);
        currentUser.trips++;
        currentUser.points += trav * 150;

        gold("You earned " + (trav * 150) + " Gold Points! Total: " + (int)currentUser.points);
        System.out.println();
        input("Press Enter to continue");
    }

    static void confettiAnimation() {
        String[] confetti = {"*", "✦", "◆", "❋", "✿", "●", "★"};
        String[] colors   = {RED, GREEN, GOLD, CYAN, MAGENTA, BLUE, WHITE};
        System.out.print("  ");
        for(int i=0;i<40;i++) {
            String c = confetti[(int)(Math.random()*confetti.length)];
            String col = colors[(int)(Math.random()*colors.length)];
            System.out.print(col + c + RESET);
            try { Thread.sleep(40); } catch(Exception e){}
        }
        System.out.println();
    }

    // ═══════════════════════════════════════════════════════════════
    //  WISHLIST
    // ═══════════════════════════════════════════════════════════════

    static void wishlistPage() {
        header("MY WISHLIST ❤️");
        System.out.println();
        if(wishlist.isEmpty()) {
            warn("Your wishlist is empty. Heart a destination to save it here.");
            System.out.println();
            input("Press Enter");
            return;
        }
        List<Destination> saved = new ArrayList<>();
        for(String id : wishlist) {
            for(Destination d : destinations) if(d.id.equals(id)) saved.add(d);
        }
        for(int i=0;i<saved.size();i++) {
            Destination d = saved.get(i);
            System.out.printf("  %s%d.%s %s %s%-14s%s  %s₹%,d%s  %s%n",
                BOLD, i+1, RESET, d.emoji, BOLD, d.name, RESET, GOLD, d.price, RESET, d.seatsLabel());
        }
        System.out.println();
        System.out.println("  " + BOLD + (saved.size()+1) + "." + RESET + "  Remove a destination");
        System.out.println("  " + BOLD + (saved.size()+2) + "." + RESET + "  Clear All Wishlist");
        System.out.println("  " + BOLD + (saved.size()+3) + "." + RESET + "  Back");
        int ch = choose("Choose", saved.size()+3);
        if(ch <= saved.size()) { destDetailView(saved.get(ch-1)); }
        else if(ch == saved.size()+1) {
            int rm = choose("Remove which? (number)", saved.size());
            wishlist.remove(saved.get(rm-1).id);
            success("Removed from wishlist.");
        } else if(ch == saved.size()+2) {
            wishlist.clear();
            success("Wishlist cleared.");
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 7 — PROFILE
    // ═══════════════════════════════════════════════════════════════

    static void profilePage() {
        while(true) {
            header("MY PROFILE — " + currentUser.name);
            System.out.println();
            System.out.printf("  %-20s %s%s%s%n", "Name:",       BOLD, currentUser.name, RESET);
            System.out.printf("  %-20s %s%n",       "Email:",      currentUser.email);
            System.out.printf("  %-20s %s%d%s%n",   "Trips Taken:",GOLD, currentUser.trips, RESET);
            System.out.printf("  %-20s %s%d%s%n",   "Gold Points:",GOLD, (int)currentUser.points, RESET);
            System.out.printf("  %-20s %s%n",       "Last Login:", currentUser.loginTime);
            System.out.printf("  %-20s %s⭐ Gold Member%s%n", "Status:", GOLD, RESET);
            System.out.println();
            System.out.println("  " + BOLD + "1." + RESET + "  Edit Profile");
            System.out.println("  " + BOLD + "2." + RESET + "  My Bookings");
            System.out.println("  " + BOLD + "3." + RESET + "  Saved Trips (Wishlist)");
            System.out.println("  " + BOLD + "4." + RESET + "  Notifications");
            System.out.println("  " + BOLD + "5." + RESET + "  Settings");
            System.out.println("  " + BOLD + "6." + RESET + "  Back");
            int ch = choose("Tab", 6);
            switch(ch) {
                case 1 -> editProfile();
                case 2 -> myBookings();
                case 3 -> wishlistPage();
                case 4 -> notifications();
                case 5 -> settingsPage();
                case 6 -> { return; }
            }
        }
    }

    static void editProfile() {
        section("Edit Profile");
        System.out.println();
        String name = input("Full Name [" + currentUser.name + "]");
        if(!name.isEmpty()) currentUser.name = name;
        String email = input("Email [" + currentUser.email + "]");
        if(!email.isEmpty() && isValidEmail(email)) currentUser.email = email;
        input("Phone (optional, press Enter to skip)");
        input("City (optional, press Enter to skip)");
        loadingBar("  Saving changes");
        success("Profile updated successfully!");
        shortPause();
    }

    static void myBookings() {
        header("MY BOOKINGS");
        System.out.println();
        List<Booking> mine = new ArrayList<>();
        for(Booking b : allBookings) if(b.userEmail.equals(currentUser.email)) mine.add(b);
        if(mine.isEmpty()) {
            warn("No bookings yet. Explore destinations to get started!");
        } else {
            for(int i=0;i<mine.size();i++) {
                Booking b = mine.get(i);
                System.out.println("  " + GOLD + "─".repeat(50) + RESET);
                System.out.printf("  %s%d.%s  %-25s  Ref: %s%s%s%n", BOLD, i+1, RESET,
                    b.destName, CYAN, b.ref, RESET);
                System.out.printf("      Package: %-30s%n", b.pkg);
                System.out.printf("      Paid: %s₹%,d%s  ·  Travellers: %d  ·  via %s%n",
                    GOLD, b.amount, RESET, b.travellers, b.payMethod.split(" ")[0]);
                System.out.printf("      Booked: %s%n", b.time);
            }
            System.out.println("  " + GOLD + "─".repeat(50) + RESET);
        }
        System.out.println();
        input("Press Enter to return");
    }

    static void notifications() {
        header("NOTIFICATIONS");
        System.out.println();
        System.out.println(GREEN + "  ✈  " + BOLD + "Welcome to WanderLust!" + RESET);
        System.out.println(DIM + "     Start exploring India's most beautiful destinations." + RESET);
        System.out.println(DIM + "     Just now" + RESET);
        System.out.println();
        System.out.println(GOLD + "  🎉  " + BOLD + "Special Offer: 10% off Kerala packages" + RESET);
        System.out.println(DIM + "     Use code KERALA10 at checkout. Valid till month end." + RESET);
        System.out.println(DIM + "     2 hours ago" + RESET);
        System.out.println();
        System.out.println(GOLD + "  ⭐  " + BOLD + "You earned 500 Gold Points!" + RESET);
        System.out.println(DIM + "     Redeem on your next booking for exclusive discounts." + RESET);
        System.out.println(DIM + "     Yesterday" + RESET);
        System.out.println();
        if(currentUser.trips > 0) {
            System.out.println(CYAN + "  🎫  " + BOLD + "You have " + currentUser.trips + " completed trip(s)!" + RESET);
            System.out.println(DIM + "     Thank you for travelling with WanderLust." + RESET);
            System.out.println();
        }
        input("Press Enter to return");
    }

    static void settingsPage() {
        header("SETTINGS");
        System.out.println();
        System.out.println("  " + BOLD + "1." + RESET + "  Email Notifications: " + GREEN + "ON" + RESET);
        System.out.println("  " + BOLD + "2." + RESET + "  Change Password");
        System.out.println("  " + BOLD + "3." + RESET + "  Back");
        int ch = choose("Option", 3);
        if(ch == 2) {
            input("Current Password");
            String np = input("New Password (min 8 chars)");
            if(isValidPassword(np)) {
                currentUser.password = np;
                loadingBar("  Updating password");
                success("Password updated successfully!");
            } else error("Password must be at least 8 characters.");
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  WEATHER TICKER
    // ═══════════════════════════════════════════════════════════════

    static void weatherTickerPage() {
        header("GLOBAL WEATHER — 23 DESTINATIONS");
        System.out.println();
        System.out.printf("  %-28s %-8s %s%n",
            BOLD+"DESTINATION"+RESET, GOLD+"TEMP"+RESET, DIM+"CONDITIONS"+RESET);
        line();
        for(String[] w : weatherData) {
            System.out.printf("  %-28s %s%-8s%s %s%s%s%n",
                w[0], GOLD, w[1], RESET, DIM, w[2], RESET);
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ═══════════════════════════════════════════════════════════════
    //  LOGOUT
    // ═══════════════════════════════════════════════════════════════

    static void doLogout() {
        String logoutTime = now();
        // Record user logout
        if(!userLog.isEmpty() && userLog.get(0).isOnline) {
            userLog.get(0).logout(  );
            userLog.get(0).logoutTime = logoutTime;
        }
        // Record admin logout
        if(!adminLog.isEmpty() && adminLog.get(0).isOnline) {
            adminLog.get(0).logout();
        }
        if(currentUser != null) {
            currentUser.online = false;
            currentUser.logoutTime = logoutTime;
        }
        loadingBar("  Signing out");
        success("You have been signed out. Safe travels!");
        currentUser = null;
        isAdmin = false;
        adminEmail = null;
        adminLoginTime = null;
        pause();
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADMIN MENU — Dashboard only
    // ═══════════════════════════════════════════════════════════════

    static void adminMenu() {
        while(true) {
            header("ADMIN DASHBOARD");
            System.out.println(DIM + "  Logged in as: " + GOLD + adminEmail + RESET);
            System.out.println(DIM + "  Login time:   " + GOLD + adminLoginTime + RESET);
            System.out.println(DIM + "  Current time: " + GOLD + now() + RESET);
            System.out.println();
            System.out.println("  " + BOLD + "1." + RESET + "  📊  Dashboard Overview (Stats)");
            System.out.println("  " + BOLD + "2." + RESET + "  🕐  Admin Login / Logout History");
            System.out.println("  " + BOLD + "3." + RESET + "  👥  Registered Users");
            System.out.println("  " + BOLD + "4." + RESET + "  🎫  All Bookings");
            System.out.println("  " + BOLD + "5." + RESET + "  🔍  User Search History");
            System.out.println("  " + BOLD + "6." + RESET + "  🗺️  Destinations & Seat Availability");
            System.out.println("  " + BOLD + "7." + RESET + "  📋  User Login / Logout History");
            System.out.println("  " + BOLD + "8." + RESET + "  🌤️  Global Weather");
            System.out.println("  " + BOLD + "9." + RESET + "  ⚡  Notices & Quick Actions");
            System.out.println("  " + BOLD + "10." + RESET + " ℹ️  Platform Information");
            System.out.println("  " + BOLD + "11." + RESET + " 🚪  Sign Out");
            System.out.println();
            int ch = choose("Dashboard section", 11);
            switch(ch) {
                case 1  -> adminStats();
                case 2  -> adminSessionHistory();
                case 3  -> adminUsersPanel();
                case 4  -> adminBookingsPanel();
                case 5  -> adminSearchHistory();
                case 6  -> adminDestinations();
                case 7  -> adminUserLog();
                case 8  -> weatherTickerPage();
                case 9  -> adminNotices();
                case 10 -> adminPlatformInfo();
                case 11 -> { doLogout(); return; }
            }
        }
    }

    // ── 1. Stats Overview ──────────────────────────────────────────
    static void adminStats() {
        header("DASHBOARD — STATS OVERVIEW");
        System.out.println();
        int totalRevenue = allBookings.stream().mapToInt(b -> b.amount).sum();

        System.out.println("  " + GOLD + "┌─────────────────────────────────────────────────┐" + RESET);
        System.out.printf("  %s│%s  %-20s  %s%s%-8s%s  %s%s%n",
            GOLD, RESET, "Registered Users",    BOLD, WHITE, String.valueOf(registeredUsers.size()+3), RESET, DIM, "( +3 default )" + GOLD + "  │" + RESET);
        System.out.printf("  %s│%s  %-20s  %s%s%-8s%s                   %s│%s%n",
            GOLD, RESET, "Total Bookings",      BOLD, WHITE, String.valueOf(allBookings.size()), RESET, GOLD, RESET);
        System.out.printf("  %s│%s  %-20s  %s%s%-8s%s                   %s│%s%n",
            GOLD, RESET, "Active Destinations", BOLD, WHITE, "9", RESET, GOLD, RESET);
        System.out.printf("  %s│%s  %-20s  %s%s%-8s%s                   %s│%s%n",
            GOLD, RESET, "Total Revenue",       BOLD, GREEN, "₹"+String.format("%,d",totalRevenue), RESET, GOLD, RESET);
        System.out.printf("  %s│%s  %-20s  %s%s%-8s%s                   %s│%s%n",
            GOLD, RESET, "Unique Searches",     BOLD, WHITE, String.valueOf(searchHistory.size()), RESET, GOLD, RESET);
        System.out.printf("  %s│%s  %-20s  %s%s%-8s%s                   %s│%s%n",
            GOLD, RESET, "Admin Sessions",      BOLD, WHITE, String.valueOf(adminLog.size()), RESET, GOLD, RESET);
        System.out.println("  " + GOLD + "└─────────────────────────────────────────────────┘" + RESET);
        System.out.println();
        input("Press Enter to return");
    }

    // ── 2. Admin Session Log ───────────────────────────────────────
    static void adminSessionHistory() {
        header("ADMIN LOGIN / LOGOUT HISTORY");
        System.out.println();
        if(adminLog.isEmpty()) {
            warn("No admin sessions recorded yet.");
        } else {
            // Summary
            SessionLog latest = adminLog.get(0);
            System.out.println("  " + GREEN + "Last Login:  " + RESET + latest.loginTime);
            System.out.println("  " + RED   + "Last Logout: " + RESET + (latest.logoutTime != null ? latest.logoutTime : GOLD + "Active now" + RESET));
            System.out.println();
            line();
            System.out.printf("  %-4s %-22s %-22s %s%n",
                DIM+"#"+RESET, GREEN+"Login Time"+RESET, RED+"Logout Time"+RESET, DIM+"Status"+RESET);
            line();
            for(int i=0;i<adminLog.size();i++) {
                SessionLog s = adminLog.get(i);
                String status = s.isOnline ? GOLD + "[NOW]" + RESET : DIM + "Offline" + RESET;
                System.out.printf("  %-4d %-22s %-22s %s%n",
                    i+1, s.loginTime, s.logoutTime != null ? s.logoutTime : GREEN+"Active"+RESET, status);
            }
            line();
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ── 3. Registered Users ────────────────────────────────────────
    static void adminUsersPanel() {
        header("REGISTERED USERS");
        System.out.println();
        // Default 3 + registered
        String[][] defaults = {
            {"Arjun Sharma", "arjun.sharma@gmail.com", "Active"},
            {"Priya Menon",  "priya.menon2024@gmail.com", "Active"},
            {"Rahul Verma",  "rahul.v.work@gmail.com", "Active"},
        };
        int idx = 1;
        for(String[] u : defaults) {
            System.out.printf("  %s%d.%s  %-20s  %-30s  %s%s%s%n",
                BOLD, idx++, RESET, u[0], u[1], GREEN, u[2], RESET);
        }
        for(User u : registeredUsers) {
            String status = u.online ? GREEN + "Online" + RESET : DIM + "Offline" + RESET;
            System.out.printf("  %s%d.%s  %-20s  %-30s  %s  Trips:%d%n",
                BOLD, idx++, RESET, u.name, u.email, status, u.trips);
        }
        System.out.println();
        info("Total: " + (defaults.length + registeredUsers.size()) + " registered users");
        System.out.println();
        input("Press Enter to return");
    }

    // ── 4. All Bookings ────────────────────────────────────────────
    static void adminBookingsPanel() {
        header("ALL BOOKINGS");
        System.out.println();
        if(allBookings.isEmpty()) {
            warn("No bookings yet.");
        } else {
            line();
            System.out.printf("  %-10s %-18s %-24s %-10s %s%n",
                DIM+"Ref"+RESET, "Destination", "User Email", GOLD+"Amount"+RESET, DIM+"Time"+RESET);
            line();
            for(Booking b : allBookings) {
                System.out.printf("  %-10s %-18s %-24s %s%-10s%s %s%n",
                    b.ref, b.destName, b.userEmail,
                    GOLD, "₹"+String.format("%,d",b.amount), RESET, DIM+b.time+RESET);
            }
            line();
            int total = allBookings.stream().mapToInt(b -> b.amount).sum();
            System.out.println();
            System.out.println("  Total Revenue: " + GOLD + BOLD + "₹" + String.format("%,d", total) + RESET);
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ── 5. Search History ──────────────────────────────────────────
    static void adminSearchHistory() {
        header("USER SEARCH HISTORY");
        System.out.println(DIM + "  Custom destinations searched outside the featured 9\n" + RESET);
        if(searchHistory.isEmpty()) {
            warn("No custom searches recorded yet.");
        } else {
            for(int i=0;i<searchHistory.size();i++) {
                System.out.printf("  %s#%-3d%s  %s%n", CYAN, i+1, RESET, searchHistory.get(i));
            }
            System.out.println();
            info(searchHistory.size() + " unique search" + (searchHistory.size()==1?"":"es") + " recorded");
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ── 6. Destinations ───────────────────────────────────────────
    static void adminDestinations() {
        header("DESTINATIONS — SEAT AVAILABILITY & REVENUE");
        System.out.println();
        line();
        System.out.printf("  %-12s %-8s %-12s %-16s %s%n",
            DIM+"Destination"+RESET, GOLD+"Price"+RESET,
            "Seats", "Fill Rate", DIM+"Potential"+RESET);
        line();
        for(Destination d : destinations) {
            double fill = ((double)(d.maxSeats - d.seats) / d.maxSeats) * 100;
            String bar = buildBar(fill, 12);
            int potential = d.seats * d.price;
            String seatStr = d.seats == 0 ?
                RED + "Sold Out" + RESET :
                (d.seats <= 3 ? YELLOW : GREEN) + d.seats + "/" + d.maxSeats + RESET;
            System.out.printf("  %s %-10s  %s₹%,d%s  %-14s  %s  %s₹%,d%s%n",
                d.emoji, d.name, GOLD, d.price, RESET,
                seatStr, bar, CYAN, potential, RESET);
        }
        line();
        System.out.println();
        input("Press Enter to return");
    }

    static String buildBar(double pct, int len) {
        int filled = (int)(pct / 100.0 * len);
        String col = pct >= 70 ? GREEN : pct >= 30 ? YELLOW : RED;
        return col + "█".repeat(Math.max(0,filled)) + DIM + "░".repeat(len-filled) + RESET + " " + (int)pct + "%";
    }

    // ── 7. User Login/Logout History ──────────────────────────────
    static void adminUserLog() {
        header("USER LOGIN / LOGOUT HISTORY");
        System.out.println();
        if(userLog.isEmpty()) {
            warn("No user sessions recorded yet. Users appear here after they log in.");
        } else {
            line();
            System.out.printf("  %-20s %-26s %-22s %-22s %s%n",
                DIM+"Name"+RESET, "Email",
                GREEN+"Logged In"+RESET, RED+"Logged Out"+RESET, DIM+"Status"+RESET);
            line();
            for(SessionLog s : userLog) {
                String status = s.isOnline ?
                    GREEN + "● Online" + RESET : DIM + "○ Offline" + RESET;
                String logout = s.logoutTime != null ? s.logoutTime : GOLD + "Active now" + RESET;
                System.out.printf("  %-20s %-26s %-22s %-22s %s%n",
                    s.name, s.email, s.loginTime, logout, status);
            }
            line();
            System.out.println();
            info(userLog.size() + " session" + (userLog.size()==1?"":"s") + " recorded");
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ── 9. Notices ────────────────────────────────────────────────
    static void adminNotices() {
        header("NOTICES & QUICK ACTIONS");
        System.out.println();
        System.out.println(RED + "  ⚠  Manali & Andaman are SOLD OUT" + RESET);
        System.out.println(DIM + "     Consider opening new slots or promoting similar packages.\n" + RESET);
        System.out.println(GREEN + "  ✔  Jaipur has the highest availability (18 seats open)" + RESET);
        System.out.println(DIM + "     Best candidate for promotional campaigns right now.\n" + RESET);
        System.out.println(GOLD + "  💡 Peak season Oct–Feb approaching" + RESET);
        System.out.println(DIM + "     Expect booking surges for Kerala, Agra and Jaipur.\n" + RESET);
        System.out.println(CYAN + "  ℹ  3 destinations with LOW availability:" + RESET);
        System.out.println(DIM + "     Agra (5 seats), Ladakh (4 seats), Goa (3 seats)\n" + RESET);

        // Revenue projections
        System.out.println(GOLD + "  Revenue Potential (if remaining seats fill):" + RESET);
        for(Destination d : destinations) {
            if(d.seats > 0) {
                System.out.printf("     %-12s  %s₹%,d%s%n", d.name, GOLD, d.seats*d.price, RESET);
            }
        }
        System.out.println();
        input("Press Enter to return");
    }

    // ── 10. Platform Info ─────────────────────────────────────────
    static void adminPlatformInfo() {
        header("PLATFORM INFORMATION");
        System.out.println();
        String[][] info = {
            {"Platform",       "WanderLust Travel & Tours"},
            {"Version",        "v2.1.0 — 2025 Edition"},
            {"Total Packages", "9 Featured + Custom"},
            {"Support Email",  "admin@wanderlust.in"},
            {"Avg Rating",     "4.9 / 5"},
            {"Admin Code",     GOLD + BOLD + "WL-ADMIN-2025" + RESET},
            {"Session Start",  adminLoginTime != null ? adminLoginTime : "—"},
            {"Current Time",   now()},
        };
        line();
        for(String[] r : info) {
            System.out.printf("  %-20s  %s%n", r[0]+":", r[1]);
        }
        line();
        System.out.println();
        input("Press Enter to return");
    }
}