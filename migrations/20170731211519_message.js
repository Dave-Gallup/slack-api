'use strict';

exports.up = function(knex) {
  return knex.schema.createTable('message', (table) => {
    table.increments('id').primary();
    table.integer('user_map_id').notNullable().references('id').inTable('user_map').onDelete('CASCADE').index();
    table.integer('channel_map_id').notNullable().references('id').inTable('channel_map').onDelete('CASCADE').index();
    table.integer('message_id').notNullable();
    table.text('message');
    table.timestamps(true, true);
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('message');
};
