const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const localStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const dotenv = require("dotenv");
const { ShoppingList, Product } = require("./models/shoppingData");

//Initialization
const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;
const CONNECTION = process.env.CONNECTION;

mongoose
    .connect(CONNECTION, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to DB"))
    .catch(console.error);
//Middlewares 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: "https://shopping-list-server-gold.vercel.app/",
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: "secretcode",
    resave: false,
    saveUninitialized: true,
}))
app.use(passport.initialize());
app.use(passport.session());

//Passport Config
passport.use(
    new localStrategy(
        { usernameField: "email" },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email: email });
                if (!user) {
                    return done(null, false);
                }
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return done(null, false);
                } return done(null, user)
            } catch (error) {
                return done(error)
            }
        })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
})

//JWT Strategy
require("./auth")

//USER FUNCTIONS

app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email });
        if (user) throw new Error("Email already exists")
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            });
            await newUser.save();
            res.send("User created");
        }
    } catch (error) {
        res.status(400).send({
            message: error.message,
            error,
        })
    }
})

app.post("/login", passport.authenticate("local"), (req, res) => {
    const { _id, email } = req.user;

    const payload = {
        _id,
        email,
    };

    const token = jwt.sign(payload, "RANDOM_TOKEN", { expiresIn: "24h" });

    return res.status(200).json({ token, user: { _id, email } })
});

app.get("/user", passport.authenticate("jwt", { session: false }), (req, res) => {
    const { _id, email } = req.user;

    const payload = {
        _id,
        email,
    };

    const token = jwt.sign(payload, "RANDOM_TOKEN", { expiresIn: "24h" });

    return res.status(200).json({ token, user: { _id, email } })
});

//como hacer enpoint que tome el Token y lo invalide

//App Data Functions 
app.get("/shoppingLists", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const { _id } = req.user
    const shoppingLists = await ShoppingList.find({ isDelete: false, userId: _id })
        .populate({ path: "list", match: { isDelete: false } })
        .exec();

    res.json(shoppingLists);
});

app.post("/shoppingList/new", passport.authenticate("jwt", { session: false }), (req, res) => {
    const { _id } = req.user
    const shoppingList = new ShoppingList({
        name: req.body.name,
        list: [],
        userId: _id
    });
    shoppingList.save();

    res.json(shoppingList);
});

app.delete("/shoppingList/:id", async (req, res) => {
    const result = await ShoppingList.findByIdAndUpdate(req.params.id, {
        isDelete: true,
    }).exec();

    res.json(result);
});

app.post("/shoppingList/:id/list", async (req, res) => {
    const shoppingList = await ShoppingList.findById(req.params.id).exec();
    const newProduct = new Product({
        name: req.body.name,
    });

    const product = await newProduct.save();

    await shoppingList.list.push(product._id);

    await shoppingList.save();

    const data = await ShoppingList.findById(req.params.id)
        .populate({ path: "list", match: { isDelete: false } })
        .exec();

    res.json(data);
});

app.patch("/shoppingList/:id/name", async (req, res) => {
    await ShoppingList.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name },
        { new: true, runValidators: true }
    );

    const data = await ShoppingList.findById(req.params.id)
        .populate({ path: "list", match: { isDelete: false } })
        .exec();

    res.json(data);
});

app.put("/shoppingList/:id/list/:itemId", async (req, res) => {
    const { id, itemId } = req.params;
    await Product.findByIdAndUpdate(itemId, {
        isChecked: req.body.isChecked,
    }).exec();

    const data = await ShoppingList.findById(id)
        .populate({ path: "list", match: { isDelete: false } })
        .exec();

    res.json(data);
});

app.delete("/shoppingList/:id/list", async (req, res) => {
    const { ids } = req.body;
    await Product.updateMany({ _id: { $in: ids } }, { isDelete: true });

    const data = await ShoppingList.findById(req.params.id)
        .populate({ path: "list", match: { isDelete: false } })
        .exec();

    res.json(data);
});

app.put("/shoppingList/:id/list", async (req, res) => {
    const { ids, isChecked } = req.body;
    await Product.updateMany({ _id: { $in: ids } }, { isChecked: isChecked });

    const data = await ShoppingList.findById(req.params.id)
        .populate({ path: "list", match: { isDelete: false } })
        .exec();

    res.json(data);
});

app.listen(PORT, () => {
    console.log("Mi servidor es el " + PORT);
});

module.exports = app;
