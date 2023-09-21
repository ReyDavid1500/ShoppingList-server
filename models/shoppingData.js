const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const { Types } = Schema;
const User = require("./user");

const ProductSchema = new Schema({
    name: {
        type: String,
        require: true,
    },
    isChecked: {
        type: Boolean,
        default: false,
    },
    isDelete: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });
const Product = model("Product", ProductSchema);


const ShoppingListSchema = new Schema(
    {
        name: {
            type: String,
            require: true,
        },
        list: [{
            type: Types.ObjectId,
            ref: "Product",
        }],
        isDelete: {
            type: Boolean,
            default: false
        },
        userId: {
            type: Types.ObjectId,
            ref: "User"
        },
    },
    { timestamps: true }
);
const ShoppingList = model("ShoppingList", ShoppingListSchema);
module.exports = { ShoppingList, Product }
