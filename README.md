# BiteSpeed Identity Reconciliation

## Hosted API

https://bitespeed-identity-reconciliation-lpcc.onrender.com/identify

## Endpoint

POST /identify

### Request

```json
{
  "email": "string",
  "phoneNumber": "string"
}
```

### Response

```json
{
  "contact": {
    "primaryContactId": number,
    "emails": [],
    "phoneNumbers": [],
    "secondaryContactIds": []
  }
}
```

## Tech Stack

Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Supabase)

## Logic

Contacts are linked when they share email or phone number.
Oldest contact remains primary.
New information creates secondary contacts.
Two primary contacts merge by converting the newer one into a secondary.
