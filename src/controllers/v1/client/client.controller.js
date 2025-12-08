import express from 'express';
import prisma from '../../../config/db.js'; 

const addClient = async (req, res) => {
  try {
    const {
      name,
      email,
      companyName,
      logo,
      website,
      phone
    } = req.body;

    // Validation
    if (!name || !email || !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and company name are required'
      });
    }

    // Check if client with email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    // Create new client
    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        companyName,
        logo: logo || null,
        website: website || null,
        phone: phone || null
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: newClient
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getClientById = async(req,res) => {
  const {clientId} = req.params
  const clientData = await prisma.client.findUnique({
    where : {id:clientId}
  })

  res.json({client:clientData})

}

export {addClient,getClientById}