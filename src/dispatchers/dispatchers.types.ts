export type EventType = 'customEvent' | 'screenEvent' | 'userIdentification';
export type PropertiesType = { [key: string]: string };
export type UserPropertiesType = {
  email?: string;
  name?: string;
  [key: string]: string | undefined;
};
export type EventData = {
  screen?: string;
  properties?: PropertiesType;
  event?: string;
  id?: string;
  userProperties?: UserPropertiesType;
};
