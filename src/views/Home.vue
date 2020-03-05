<template>
  <v-container>
    <v-card>
      <v-card-title>Calendar</v-card-title>
      <v-divider></v-divider>
      <v-row>
        <v-col cols="12" md="4">
          <v-container>
            <v-form ref="eventForm">
              <v-text-field
                v-model="firstName"
                :rules="nameRules"
                :counter="100"
                label="Event name"
                required
              ></v-text-field>
              <v-form ref="datePickers">
                <v-row>
                  <v-col>
                    <v-menu
                      v-model="startDateMenu"
                      :close-on-content-click="false"
                      :nudge-right="40"
                      transition="scale-transition"
                      offset-y
                      max-width="290px"
                      min-width="290px"
                    >
                      <template v-slot:activator="{ on }">
                        <v-text-field label="From" readonly :value="startDateVal" v-on="on"></v-text-field>
                      </template>
                      <v-date-picker
                        locale="en-in"
                        v-model="startDateVal"
                        no-title
                        @input="handlestartDatePick"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>
                  <v-col>
                    <v-menu
                      v-model="endDateMenu"
                      :close-on-content-click="false"
                      :nudge-right="40"
                      transition="scale-transition"
                      offset-y
                      max-width="290px"
                      min-width="290px"
                    >
                      <template v-slot:activator="{ on }">
                        <v-text-field
                          label="To"
                          readonly
                          :rules="getEndDateRules"
                          :value="endDateVal"
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-form ref="endDatePicker">
                        <v-date-picker
                          locale="en-in"
                          v-model="endDateVal"
                          no-title
                          @input="endDateMenu = false"
                          :min="startDateVal"
                        ></v-date-picker>
                      </v-form>
                    </v-menu>
                  </v-col>
                </v-row>
              </v-form>
              <v-row>
                <v-col v-for="(day, i) in days" :key="i" cols="4">
                  <v-checkbox v-model="daysSelected" :label="day | dayOfTheWeek" :value="day"></v-checkbox>
                </v-col>
              </v-row>
              <v-row>
                <v-container>
                  <v-btn color="primary" block @click="handleSubmit">Submit</v-btn>
                </v-container>
              </v-row>
            </v-form>
          </v-container>
        </v-col>
        <v-col cols="12" md="8">
          <v-container v-for="(data, i) in getCardsData" :key="i">
            <v-card>
              <v-card-title>{{ data.header }}</v-card-title>
              <v-divider></v-divider>
              <template v-for="(day, j) in data.days">
                <div :key="j" class="d-flex" :class="{ 'green lighten-5': day.event }">
                  <v-card-text class="bg-green">{{ day.display }}</v-card-text>
                  <v-card-text class="bg-green">{{ day.event ? day.event.name : '' }}</v-card-text>
                </div>
                <v-divider :key="`divider-${j}`"></v-divider>
              </template>
            </v-card>
          </v-container>
        </v-col>
        {{ calendarEvents }}
      </v-row>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import moment, { Moment } from "moment";
import { CalendarEvent } from "../models/CalendarEvent";
import { BackendResponse } from "../models/BackendResponse";

enum DayOfTheWeek {
  SUNDAY = "sunday",
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday"
}

/**
 * Different date formats supported by moment
 * HEADER  -- For header display
 * API     -- To date format returned and supported by the API
 * DISPLAY -- For individual date display
 */
enum DateFormat {
  HEADER = "MMMM YYYY",
  API = "YYYY-MM-DD",
  DISPLAY = "D ddd"
}

interface CardData {
  header: string;
  days: {
    [date: string]: { event: CalendarEvent | undefined; display: string };
  };
}

function validateFutureDate(date: Date | string | Moment, basis = moment()) {
  return moment(date).isSameOrAfter(basis, "day");
}

function getDaysBetweenDates(
  startDate: Date | string | Moment,
  endDate: Date | string | Moment
): ReadonlyArray<Moment> {
  const now = moment(startDate).clone();
  const dates: Moment[] = [];
  while (now.isSameOrBefore(moment(endDate))) {
    dates.push(now.clone());
    now.add(1, "days");
  }
  return dates;
}

const calendarApiUrl = `${process.env.VUE_APP_API_URL}calendar-events`;

export default Vue.extend({
  name: "Home",
  mounted() {
    this.fetchEvents();
  },
  data() {
    return {
      firstName: "",
      nameRules: [
        v => !!v || "Name is required",
        v => v.length <= 100 || "Name must be less than 100 characters"
      ],
      startDateMenu: false,
      startDateVal: undefined,
      endDateMenu: false,
      endDateVal: undefined,
      days: Object.values(DayOfTheWeek),
      daysSelected: [] as DayOfTheWeek[],
      calendarEvents: [] as CalendarEvent[]
    };
  },
  computed: {
    getEndDateRules() {
      return [
        v =>
          validateFutureDate(v, this.startDateVal) ||
          "End date must be later than start date"
      ];
    },
    getCardsData(): ReadonlyArray<CardData> {
      if (!(this.startDateVal && this.endDateVal)) {
        return [];
      }
      const startDate = moment(this.startDateVal);
      const endDate = moment(this.endDateVal);
      const cardsData: CardData[] = [];
      let currentMonth = startDate.month();
      let currentCardData: CardData = {
        header: startDate.format(DateFormat.HEADER),
        days: {}
      };
      cardsData.push(currentCardData);
      getDaysBetweenDates(startDate, endDate).forEach(date => {
        if (date.month() !== currentMonth) {
          currentMonth = date.month();
          currentCardData = {
            header: date.format(DateFormat.HEADER),
            days: {}
          };
          cardsData.push(currentCardData);
        }
        currentCardData.days = {
          ...currentCardData.days,
          [date.format(DateFormat.API)]: {
            event: undefined,
            display: date.format(DateFormat.DISPLAY)
          }
        };
      });
      this.calendarEvents.map((event: CalendarEvent) => {
        cardsData.map(cardData => {
          if (cardData.days[event.date]) {
            cardData.days[event.date].event = event;
          }
        });
      });
      return cardsData;
    }
  },
  methods: {
    handlestartDatePick() {
      this.startDateMenu = false;
      if (this.endDateVal) {
        this.$refs.datePickers.validate();
      }
    },
    handleSubmit() {
      const isValidEventForm = this.$refs.eventForm.validate();
      const isValidDatePickers = this.$refs.datePickers.validate();
      if (isValidEventForm && isValidDatePickers) {
        console.log(this.daysSelected);
      }
    },
    fetchEvents() {
      fetch(calendarApiUrl)
        .then(res => res.json())
        .then((res: BackendResponse) => {
          if (res.status === "success") {
            this.calendarEvents = res.data.map(event => ({
              id: event.id,
              date: event.date,
              name: event.name
            }));
          }
        });
    }
  },
  filters: {
    dayOfTheWeek: function(value) {
      if (!value) return "";
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.substring(1, 3);
    }
  }
});
</script>
