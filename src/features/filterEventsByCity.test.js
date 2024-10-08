import React from "react";
import { loadFeature, defineFeature } from "jest-cucumber";
import { render, within, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import App from "../App";
import { getEvents } from "../mock-data";

const feature = loadFeature("./src/features/filterEventsByCity.feature");

defineFeature(feature, (test) => {
  let AppComponent;
  let CitySearchDOM;
  let AppDOM;
  let citySearchInput;
  let suggestionListItems;

  test("When user has not searched for a city, show upcoming events from all cities.", ({
    given,
    when,
    then,
  }) => {
    given("user has not searched for any city", () => {});

    when("the user opens the app", () => {
      AppComponent = render(<App />);
    });

    then("the user should see the list of all upcoming events", async () => {
      const AppDOM = AppComponent.container.firstChild;
      const EventListDOM = AppDOM.querySelector("#event-list");

      await waitFor(() => {
        const EventListItems = within(EventListDOM).queryAllByRole("listitem");
        expect(EventListItems.length).toBe(32);
      });
    });
  });

  test("User sees suggestions when searching for a city.", ({
    given,
    when,
    then,
  }) => {
    given("the main page is open", () => {
      AppComponent = render(<App />);
    });

    when("user starts typing in the city textbox", async () => {
      const user = userEvent.setup();
      const AppDOM = AppComponent.container.firstChild;

      await waitFor(() => {
        CitySearchDOM = AppDOM.querySelector("#city-search");
        expect(CitySearchDOM).toBeInTheDocument();
      });

      const citySearchInput = within(CitySearchDOM).queryByRole("textbox");
      await user.type(citySearchInput, "Berlin");
    });

    then(
      "the user should receive a list of cities (suggestions) that match what they have typed",
      async () => {
        const suggestionListItems =
          within(CitySearchDOM).queryAllByRole("listitem");
        expect(suggestionListItems).toHaveLength(2);
      }
    );
  });

  test("User can select a city from the suggested list.", ({
    given,
    and,
    when,
    then,
  }) => {
    given("user was typing “Berlin” in the city textbox", async () => {
      AppComponent = render(<App />);
      const user = userEvent.setup();
      AppDOM = AppComponent.container.firstChild;
      CitySearchDOM = AppDOM.querySelector("#city-search");
      citySearchInput = within(CitySearchDOM).queryByRole("textbox");
      await user.type(citySearchInput, "Berlin");
    });

    and("the list of suggested cities is showing", () => {
      suggestionListItems = within(CitySearchDOM).queryAllByRole("listitem");
      expect(suggestionListItems).toHaveLength(2);
    });

    when(
      "the user selects a city (e.g., “Berlin, Germany”) from the list",
      async () => {
        const user = userEvent.setup();
        await user.click(suggestionListItems[0]);
      }
    );

    then(
      "their city should be changed to that city (i.e., “Berlin, Germany”)",
      () => {
        expect(citySearchInput.value).toBe("Berlin, Germany");
      }
    );

    and(
      "the user should receive a list of upcoming events in that city",
      async () => {
        const EventListDOM = AppDOM.querySelector("#event-list");
        const EventListItems = within(EventListDOM).queryAllByRole("listitem");
        const allEvents = await getEvents();
        const berlinEvents = allEvents.filter(
          (event) => event.location === citySearchInput.value
        );
        expect(EventListItems).toHaveLength(berlinEvents.length);
      }
    );
  });
});
