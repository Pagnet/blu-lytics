export type EventType = 'customEvent' | 'screenEvent' | 'userIdentification';
export type PropertiesType = { [key: string]: string };
export type UserPropertiesType = {
  email?: string;
  name?: string;
  [key: string]: string | undefined;
};
