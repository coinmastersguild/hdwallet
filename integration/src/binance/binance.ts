import { bip32ToAddressNList, HDWallet, BinanceWallet, supportsBinance, BinanceTx } from "@shapeshiftoss/hdwallet-core";
import { HDWalletInfo } from "@shapeshiftoss/hdwallet-core/src/wallet";

import tx02_unsigned from "./tx02.mainnet.unsigned.json";
import tx02_signed from "./tx02.mainnet.signed.json";

const MNEMONIC12_NOPIN_NOPASSPHRASE = "alcohol woman abuse must during monitor noble actual mixed trade anger aisle";

const TIMEOUT = 60 * 1000;

/**
 *  Main integration suite for testing BinanceWallet implementations' Cosmos support.
 */
export function binanceTests(get: () => { wallet: HDWallet; info: HDWalletInfo }): void {
  let wallet: BinanceWallet & HDWallet;

  describe("Binance", () => {
    beforeAll(async () => {
      const { wallet: w } = get();
      if (supportsBinance(w)) wallet = w;
    });

    beforeEach(async () => {
      if (!wallet) return;
      await wallet.wipe();
      await wallet.loadDevice({
        mnemonic: MNEMONIC12_NOPIN_NOPASSPHRASE,
        label: "test",
        skipChecksum: true,
      });
    }, TIMEOUT);

    test(
      "binanceGetAccountPaths()",
      () => {
        if (!wallet) return;
        let paths = wallet.binanceGetAccountPaths({ accountIdx: 0 });
        console.log("binanceGetAccountPaths: ", paths);

        expect(paths.length > 0).toBe(true);
        expect(paths[0].addressNList[0] > 0x80000000).toBe(true);
      },
      TIMEOUT
    );

    test(
      "binanceGetAddress()",
      async () => {
        if (!wallet) return;
        expect(
          await wallet.binanceGetAddress({
            addressNList: bip32ToAddressNList("m/44'/714'/0'/0/0"),
            showDisplay: false,
          })
        ).toEqual("bnb1afwh46v6nn30nkmugw5swdmsyjmlxslgjfugre");
      },
      TIMEOUT
    );

    test(
      "binanceSignTx()",
      async () => {
        if (!wallet) return;

        let res = await wallet.binanceSignTx({
          tx: tx02_unsigned,
          addressNList: bip32ToAddressNList("m/44'/714'/0'/0/0"),
          chain_id: "Binance-Chain-Nile",
          account_number: "24250",
          sequence: "0",
        });

        console.log("**** bnb tx: ", res);

        console.log("**** bnb wallet: ", wallet.getVendor());
        //base64 reference sig
        let refSig = new Buffer(tx02_signed.signatures[0].signature.data).toString("base64");

        if (wallet.getVendor() === "KeepKey") {
          //Keepkey forms sig differently
          refSig = "x82ygfaUylT85l9nDfJNydavmDKxnIRPiilA4UQ7GiloAkGZiK3X82XAokqeyRguVsiJwiwifh562+7lvrm44g==";
        }

        expect(res.signatures.signature).toEqual(refSig);
      },
      TIMEOUT
    );
  });
}
