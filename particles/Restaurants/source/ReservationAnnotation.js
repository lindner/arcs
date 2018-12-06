// @license
// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

defineParticle(({DomParticle, html}) => {

  const template = html`

<style>
  [reservation-annotation] {
    text-align: center;
  }
  * {
    vertical-align: middle;
  }
  .x-select {
    padding-left: 16px;
    display: flex;
    position: relative;
  }
  .x-select::after {
    content: '▼';
    display: block;
    position: absolute;
    right: 8px;
    bottom: 16px;
    transform: scaleY(0.4) scaleX(0.8);
    pointer-events: none;
  }
  .x-select > select {
    position: relative;
    margin: 0;
    padding: 0;
    border: 0;
    background-color: transparent;
    border-radius: 0;
    font-size: 16px;
    overflow: hidden;
    outline: none;
    -webkit-appearance: none;
    vertical-align: top;
  }
  input {
    font-family: 'Google Sans';
    font-size: 16px;
    vertical-align: top;
    border: 0;
    background: transparent;
    padding-left: 16px;
  }
  input::-webkit-clear-button {
    display: none;
  }
  [times] {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }
  [times] > button {
    width: 64px;
    height: 64px;
    padding: 0;
    color: #4fc9ff;
    background: white;
    border-radius: 50%;
    border: 3px solid #4fc9ff;
    font-size: 16px;
    font-weight: bold;
    -webkit-appearance: none;
    outline: none;
  }
  [times] > button:disabled {
    opacity: 0.8;
    color: #888;
    border-color: #888;
  }
</style>

<div reservation-annotation id={{subId}}>
  <div times>{{availableTimes}}</div>
</div>

<template available-times>
  <button disabled$={{notAvailable}}>{{time}}</button>
</template>
`;

  return class extends DomParticle {
    get template() {
      return template;
    }
    update(props, state) {
      if (!props.event) {
        const now = this.toDateInputValue(new Date());
        const event = {startDate: now, endDate: now, participants: 2};
        this._setState({currentEvent: event});
      } else {
        const event = props.event;
        this._setState({currentEvent: event});
      }
    }
    toDateInputValue(date) {
      const local = new Date(date);
      local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return local.toJSON().slice(0, 16);
    }
    render({restaurant}, {currentEvent}) {
      if (restaurant) {
        return this.renderSingle(restaurant, currentEvent.startDate, parseInt(currentEvent.participants) || 2);
      }
    }
    renderSingle(restaurant, date, partySize) {
      const restaurantId = restaurant.id || '';
      const times = this.makeUpReservationTimes(restaurantId, partySize, date, 5);
      return {
        subId: restaurantId,
        availableTimes: {
          $template: 'available-times',
          models: times
        }
      };
    }
    makeUpReservationTimes(id, partySize, date, n) {
      // Start at (n-1)/2 half hours before the desired reservation time
      const t = new Date(date);
      t.setMinutes(t.getMinutes() - (n-1)/2*30);
      let hour = (t.getHours()) % 24;
      let minute = t.getMinutes() >= 30 ? '30' : '00';
      // Seed per restaurant and day
      const seed = parseInt(id.substr(0, 8), 16);
      let ts = t.getTime();
      ts = ts - (ts % 86400000); // Round to closest day
      const result = [];
      while (n--) {
        // This seems somewhat balanced
        const notAvailable = (seed*(hour*2+minute/30)*(ts/86400000))%10 <= partySize;
        result.push({
          time: `${hour}:${minute}`,
          notAvailable
        });
        // Increment time slot
        if (minute == '30') {
          hour = (hour + 1) % 24;
          minute = '00';
        } else {
          minute = '30';
        }
      }
      return result;
    }
  };

});