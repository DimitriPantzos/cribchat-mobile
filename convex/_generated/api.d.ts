/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bedtimeTimer from "../bedtimeTimer.js";
import type * as breastfeedTimer from "../breastfeedTimer.js";
import type * as caregivers from "../caregivers.js";
import type * as chat from "../chat.js";
import type * as children from "../children.js";
import type * as crySessions from "../crySessions.js";
import type * as dailyLogs from "../dailyLogs.js";
import type * as invites from "../invites.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as napTimer from "../napTimer.js";
import type * as sleepLogs from "../sleepLogs.js";
import type * as sleepSession from "../sleepSession.js";
import type * as subscriptions from "../subscriptions.js";
import type * as summaries from "../summaries.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bedtimeTimer: typeof bedtimeTimer;
  breastfeedTimer: typeof breastfeedTimer;
  caregivers: typeof caregivers;
  chat: typeof chat;
  children: typeof children;
  crySessions: typeof crySessions;
  dailyLogs: typeof dailyLogs;
  invites: typeof invites;
  messages: typeof messages;
  migrations: typeof migrations;
  napTimer: typeof napTimer;
  sleepLogs: typeof sleepLogs;
  sleepSession: typeof sleepSession;
  subscriptions: typeof subscriptions;
  summaries: typeof summaries;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
