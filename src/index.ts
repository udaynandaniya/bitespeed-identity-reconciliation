
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bitespeed server running");
});

app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
         return res.status(400).json({ error: "Either email or phoneNumber must be provided" }); 
        }

    // 1️⃣ Find any contacts with same email OR phone
    const existingContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined }
        ]
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    // 2️⃣ If no contact exists → create PRIMARY
    if (existingContacts.length === 0) {
      const newContact = await prisma.contact.create({
        data: {
          email: email,
          phoneNumber: phoneNumber,
          linkPrecedence: "primary"
        }
      });

      return res.json({
        contact: {
          primaryContactId: newContact.id,
          emails: [newContact.email].filter(Boolean),
          phoneNumbers: [newContact.phoneNumber].filter(Boolean),
          secondaryContactIds: []
        }
      });
    }

    // 3️⃣ Determine primary contact
    let primaryContact =
      existingContacts.find(c => c.linkPrecedence === "primary") ||
      await prisma.contact.findUnique({
        where: { id: existingContacts[0].linkedId! }
      });

    // 4️⃣ Check if incoming info is new
    const allEmails = existingContacts.map(c => c.email);
    const allPhones = existingContacts.map(c => c.phoneNumber);

    const isNewEmail = email && !allEmails.includes(email);
    const isNewPhone = phoneNumber && !allPhones.includes(phoneNumber);

    // 5️⃣ If new info → create SECONDARY contact
    if (isNewEmail || isNewPhone) {
      await prisma.contact.create({
        data: {
          email: email,
          phoneNumber: phoneNumber,
          linkedId: primaryContact!.id,
          linkPrecedence: "secondary"
        }
      });
    }

    // 6️⃣ Fetch all linked contacts
    const linkedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact!.id },
          { linkedId: primaryContact!.id }
        ]
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    // 7️⃣ Prepare response data
    const emails = [
      ...new Set(linkedContacts.map(c => c.email).filter(Boolean))
    ];

    const phoneNumbers = [
      ...new Set(linkedContacts.map(c => c.phoneNumber).filter(Boolean))
    ];

    const secondaryContactIds = linkedContacts
      .filter(c => c.linkPrecedence === "secondary")
      .map(c => c.id);

    // 8️⃣ Final response
    res.json({
      contact: {
        primaryContactId: primaryContact!.id,
        emails,
        phoneNumbers,
        secondaryContactIds
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
