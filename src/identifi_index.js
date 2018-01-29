import btree from 'merkle-btree';
import util from './util';

const DEFAULT_INDEX_ROOT = `/ipns/Qmbb1DRwd75rZk5TotTXJYzDSJL6BaNT1DAQ6VbKcKLhbs`;
const DEFAULT_IPFS_PROXIES = [`https://identi.fi`, `https://ipfs.io`];
const IPFS_INDEX_WIDTH = 200;

class IdentityProfile {
  constructor(data) {
    this.data = data;
  }

  verified(attribute) {
    let v;
    let best = 0;
    this.data.attrs.forEach(a => {
      if (a.name === attribute && a.pos * 2 > a.neg * 3 && a.pos - a.neg > best) {
        v = a.val;
        best = a.pos - a.neg;
      }
    });
    return v;
  }

  profileCard() {
    return;
  }

  avatar() {
    return;
  }
}

class IdentifiIndex {
  async init(indexRoot = DEFAULT_INDEX_ROOT, ipfs = DEFAULT_IPFS_PROXIES) {
    if (typeof ipfs === `string`) {
      this.storage = new btree.IPFSGatewayStorage(ipfs);
    } else if (Array.isArray(ipfs)) {
      this.storage = new btree.IPFSGatewayStorage(ipfs[0]);
    } else if (typeof ipfs === `object`) {
      this.storage = new btree.IPFSStorage(ipfs);
    } else {
      throw `ipfs param must be a gateway url, array of urls or a js-ipfs object`;
    }
    this.index = await btree.MerkleBTree.getByHash(`${indexRoot}/identities_by_searchkey`, this.storage, IPFS_INDEX_WIDTH);
    return true;
  }

  /*
  Get an identity referenced by an identifier.
  If type is undefined, tries to guess it.
  */
  async get(value, type) {
    if (typeof value === `undefined`) {
      throw `Value is undefined`;
    }
    if (typeof type === `undefined`) {
      type = util.guessTypeOf(value);
    }

    const profileUri = await this.index.get(`${encodeURIComponent(value)}:${encodeURIComponent(type)}`);
    if (profileUri) {
      const p = await this.storage.get(profileUri);
      return new IdentityProfile(JSON.parse(p));
    }
  }

  async search(value, type, limit = 5) { // TODO: param 'exact'
    return this.index.searchText(encodeURIComponent(value), limit);
  }
}

export default IdentifiIndex;
