<template>
  <v-container>
    <v-card>
      <v-card-title>Calendar</v-card-title>
      <v-divider></v-divider>
      <v-row>
        <v-col cols="12" md="4">
          <v-container>
            <v-form ref="eventForm" @submit="handleSubmit" @submit.prevent>
              <v-text-field
                v-model="eventName"
                :rules="nameRules"
                :counter="100"
                label="Event name"
                required
              ></v-text-field>
              <v-form ref="datePickers" @submit="handleSubmit" @submit.prevent>
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
                        <v-text-field
                          label="From"
                          readonly
                          :rules="dateRequiredRule"
                          :value="startDateFormValue"
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        locale="en-in"
                        v-model="startDateFormValue"
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
                          :rules="[...getEndDateRules, ...dateRequiredRule]"
                          :value="endDateFormValue"
                          v-on="on"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        locale="en-in"
                        v-model="endDateFormValue"
                        no-title
                        @input="endDateMenu = false"
                        :min="startDateFormValue"
                      ></v-date-picker>
                    </v-menu>
                  </v-col>
                </v-row>
              </v-form>
              <v-row>
                <v-col v-for="(day, i) in days" :key="i" cols="4">
                  <v-checkbox
                    v-model="daysSelected"
                    hide-details
                    :label="day | shortenedDayOfTheWeek"
                    :rules="emptyCheckboxRule"
                    :value="day"
                  ></v-checkbox>
                </v-col>
              </v-row>
              <v-row>
                <v-container>
                  <v-btn :loading="isLoading" color="primary" block @click="handleSubmit">Submit</v-btn>
                </v-container>
              </v-row>
            </v-form>
          </v-container>
        </v-col>
        <v-col cols="12" md="8">
          <v-container v-for="(data, i) in generateCardsData" :key="i">
            <v-card>
              <v-card-title>{{ data.header }}</v-card-title>
              <v-divider></v-divider>
              <template v-for="(day, j) in data.days">
                <div :key="j" class="d-flex" :class="{ 'green lighten-5': day.event }">
                  <v-card-text class="bg-green">{{ day.display }}</v-card-text>
                  <v-card-text class="bg-green">{{ day.event ? day.event.name : "" }}</v-card-text>
                </div>
                <v-divider :key="`divider-${j}`"></v-divider>
              </template>
            </v-card>
          </v-container>
        </v-col>
      </v-row>
    </v-card>
    <v-snackbar
      v-model="showSuccessNotif"
      color="success"
      :right="true"
      :top="true"
      :timeout="6000"
    >
      Successfully saved events!
      <v-icon @click="showSuccessNotif = false">mdi-close</v-icon>
    </v-snackbar>
    <v-snackbar v-model="showErrorNotif" color="error" :right="true" :top="true" :timeout="6000">
      {{ errorNotifMessage || "Oops, something went wrong! Try again." }}
      <v-icon @click="handleCloseErrorNotif">mdi-close</v-icon>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import moment, { Moment } from "moment";
import {
  DaysOfTheWeek,
  DateFormat,
  validateFutureDate,
  getDaysBetweenDates
} from "../helpers/DateHelper";
import {
  CalendarEvent,
  CalendarEventApiPayload
} from "../models/CalendarEvent";
import { apiFetchEvents, apiCreateEvents } from "../helpers/EventApiHelper";
import { BackendResponse } from "../models/BackendResponse";

/**
 * Data to populate the calendar display
 * `header` -- Displaying the month and year
 * `days`   -- Object with date strings as indexes for easier matching with dates from the API
 */
interface CardData {
  header: string;
  days: {
    [date: string]: { event: CalendarEvent | undefined; display: string };
  };
}

export default Vue.extend({
  name: "Home",
  mounted() {
    this.fetchEvents();
  },
  data() {
    return {
      eventName: "",
      nameRules: [
        v => !!v || "Name is required",
        v => v.length <= 100 || "Name must be less than 100 characters"
      ],
      dateRequiredRule: [v => !!v || "Date is required"],
      emptyCheckboxRule: [
        v => v.length > 0 || "One of the checkboxes must be ticked"
      ],
      startDateMenu: false,
      startDateFormValue: undefined,
      endDateMenu: false,
      endDateFormValue: undefined,
      days: DaysOfTheWeek,
      daysSelected: [],
      calendarEvents: [] as CalendarEvent[],
      isLoading: false,
      showSuccessNotif: false,
      showErrorNotif: false,
      errorNotifMessage: ""
    };
  },
  computed: {
    getEndDateRules() {
      return [
        v =>
          validateFutureDate(v, this.startDateFormValue) ||
          "End date must be later than start date"
      ];
    },
    /**
     * Used in displaying the dates and events in the calendar card
     */
    generateCardsData(): ReadonlyArray<CardData> {
      if (!(this.startDateFormValue && this.endDateFormValue)) {
        return [];
      }
      const startDate = moment(this.startDateFormValue);
      const endDate = moment(this.endDateFormValue);
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
      if (this.endDateFormValue) {
        this.$refs.datePickers.validate();
      }
    },
    handleSubmit() {
      const isValidEventForm = this.$refs.eventForm.validate();
      const isValidDatePickers = this.$refs.datePickers.validate();
      if (isValidEventForm && isValidDatePickers) {
        this.createEvents();
      }
    },
    handleCloseErrorNotif() {
      this.showErrorNotif = false;
      this.errorNotifMessage = "";
    },
    handleShowErrorNotif(message = "") {
      this.errorNotifMessage = message;
      this.showErrorNotif = true;
    },
    fetchEvents() {
      apiFetchEvents()
        .then((res: BackendResponse) => {
          if (res.status === "success") {
            this.calendarEvents = res.data.map(event => ({
              id: event.id,
              date: event.date,
              name: event.name
            }));
          } else {
            this.handleShowErrorNotif(
              "Something went wrong trying to retrieve events. Please refresh the page."
            );
          }
        })
        .catch(e =>
          this.handleShowErrorNotif(
            "Something went wrong trying to retrieve events. Please refresh the page."
          )
        );
    },
    generatePostEventPayload(): CalendarEventApiPayload {
      return {
        payload: getDaysBetweenDates(
          this.startDateFormValue,
          this.endDateFormValue
        )
          .filter(date => {
            return this.daysSelected.includes(DaysOfTheWeek[date.day()]);
          })
          .map(filteredDate => {
            return {
              name: this.eventName,
              date: filteredDate.format(DateFormat.API)
            };
          })
      };
    },
    createEvents() {
      this.isLoading = true;
      apiCreateEvents(this.generatePostEventPayload())
        .then((res: BackendResponse) => {
          if (res.status === "success") {
            this.calendarEvents = res.data;
            this.showSuccessNotif = true;
          } else {
            this.handleShowErrorNotif(
              "Something went wrong trying to save events. Please try again."
            );
          }
          this.isLoading = false;
        })
        .catch(() => {
          this.isLoading = false;
          this.handleShowErrorNotif(
            "Something went wrong trying to save events. Please try again."
          );
        });
    }
  },
  filters: {
    /**
     * Sunday => Sun, Monday => Mon, etc.
     */
    shortenedDayOfTheWeek: function(value: any) {
      if (!value) return "";
      const stringValue: string = value.toString();
      return (
        stringValue.charAt(0).toUpperCase() +
        stringValue.substring(1, 3).toLowerCase()
      );
    }
  }
});
</script>
