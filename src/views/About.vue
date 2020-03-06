<template>
  <v-container>
    <v-card>
      <v-card-title>Welcome!</v-card-title>
      <v-card-subtitle
        >My name's Kendall, and I had a lot of fun creating this website. Thanks
        for the challenge!</v-card-subtitle
      >
      <v-card-text>
        You can check out the repository for this project
        <a href="https://github.com/sloonzz/calendar-spa" target="_blank"
          >here.</a
        >
        <br />You can also check out my expense tracker project (also made with
        Laravel and Vue)
        <a href="https://sloonzz-expense-tracker.herokuapp.com" target="_blank"
          >here</a
        >, and its
        <a href="https://github.com/sloonzz/expense-tracker" target="_blank"
          >repository.</a
        >
      </v-card-text>
      <v-card-actions>
        <v-btn
          href="https://www.linkedin.com/in/kendall-rancis-segovia/"
          target="_blank"
          text
        >
          <v-icon>mdi-linkedin</v-icon>
        </v-btn>
        <v-btn href="mailto:kendallrancissegovia@gmail.com" text>
          <v-icon>mdi-email</v-icon>
        </v-btn>
        <v-btn href="https://github.com/sloonzz" target="_blank" text>
          <v-icon>mdi-github-circle</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none;
}
</style>
