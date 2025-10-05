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

// Decrypt message
export const decryptMessage = async (encryptedText, privateKey) => {
    try {
        console.log("[decryptMessage] Importing private key...");
        const key = await webcrypto.subtle.importKey(
            'jwk',
            privateKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['decrypt']
        );
        console.log("[decryptMessage] Private key imported successfully.");

        const buffer = Buffer.from(encryptedText, 'base64');
        console.log(`[decryptMessage] Created buffer with length: ${buffer.length}`);

        const decrypted = await webcrypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            key,
            buffer
        );
        console.log(`[decryptMessage] crypto.subtle.decrypt executed. Result length: ${decrypted.byteLength}`);

        const decodedText = new TextDecoder().decode(decrypted);
        console.log(`[decryptMessage] Decoded text: ${decodedText}`);
        return decodedText;
    } catch (error) {
        console.error("[decryptMessage] An error occurred inside decryptMessage:", error);
        // Re-throw the error so the calling function's catch block is triggered
        throw error;
    }
};