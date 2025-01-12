import jwt from 'jsonwebtoken';
import { webcrypto } from 'crypto';

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    })
    res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"
    })
    return token;
}

// Key generation for users
export async function generateKeyPair() {
    const keyPair = await webcrypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
    
    // Export both keys as JWK
    const publicKeyJwk = await webcrypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await webcrypto.subtle.exportKey("jwk", keyPair.privateKey);
    
    return {
        publicKey: publicKeyJwk,
        privateKey: privateKeyJwk
    };
}

// Encrypt message
export async function encryptMessage(message, publicKeyJwk) {
    const publicKey = await webcrypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );

    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    const encryptedBuffer = await webcrypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        messageBuffer
    );

    return Buffer.from(encryptedBuffer).toString('base64');
}
