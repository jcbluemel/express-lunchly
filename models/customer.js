"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search customers by name. */

  static async search(name) {

    //TODO: use ILIKE, see if first_name or last_name
    // split the name on spaces? how do we decide which is the first
    // or last name.
    const [fname, lname] = name.split(" ")

    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName"
           FROM customers
           WHERE first_name ILIKE $1 
            OR last_name ILIKE $1 
            OR first_name ILIKE $2 
            OR last_name ILIKE $2
            ORDER BY last_name`,
        ["%"+ fname + "%", "%"+ lname + "%"],
    );

    const customers = results.rows.map(c => new Customer(c));

    if (!customers) {
      const err = new Error(`No such customer: ${name}`);
      err.status = 404;
      throw err;
    }
    return customers;
  }


  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }


  /** return the customer's full name. */

  getFullName() {
    return `${this.firstName} ${this.lastName}`
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
}

module.exports = Customer;
