import Store from 'store-prototype';
import Promise from 'bluebird';
import superagent from 'superagent-bluebird-promise';
import {headers,endpoint} from '../config/http';
import utils from './utils';
import _ from 'lodash';

///////////////////////////////
//
//
// Public Methods
//
//
///////////////////////////////

Store.prototype.getState = function getState(){
    if(this.state.length === 0){
        return this._fetch();
    } else {
        return Promise.resolve(this.state); 
    }
};

Store.prototype.getById = function getById(id){
    if(this.state.length > 0){
        return this._getById(id);
    } else {
        this._fetch().then(()=>{
            return this._getById(id);
        });
    }
};
Store.prototype.parse = function parse(data){
    const relevantKeys = Object.keys(this.model);
    var parsedObj = relevantKeys.reduce((acc,curr)=>{
        let obj = {};
        if(data[curr] != null){
            obj[curr] = data[curr];
        }
        return _.extend(acc,obj);
    }, {});
    return parsedObj;
};
Store.prototype.save = function save(newItem,oldItem) {
    const payload = this.parse(newItem);
    return superagent.post(`${endpoint}${this.resource}`)
            .set(headers)
            .send(payload)
            .then((res) => {
                if(newItem[this.idAttribute] != null){
                    this.updateState(utils.update(this.state,res.body,oldItem),'save')
                } else {
                    this.updateState(utils.add(this.state,res.body),'save');
                }
    }).catch((err)=>{
        //parse error messages
        const errPayload = JSON.parse(err.body);
        let errors = Object.keys(errPayload);
        return Promise.reject(errors.map((key)=>{
            let data = {}
            data[key] = {
                message: errPayload[key][0].message
            } 
            return data;
        }).reduce((acc,curr)=>{
            return _.extend(acc, curr);
        }, {}));
    });
};

Store.prototype.delete = function(item) {
    const id = item[this.idAttribute];
    return superagent.del(`${endpoint}${this.resource}/${id}`)
            .set(headers)
            .send(item)
            .then(() => {
                this.updateState(
                    utils.remove(this.state,item)
                );
            });
};

///////////////////////////////
//
//
// Internal Methods
//
//
///////////////////////////////


Store.prototype._getById = function _getById(id){
    const query = {};
    query[this.idAttribute] = id;
    const value = this.utils.find(this.state, query);
    if(typeof value === 'undefined'){
        return Promise.reject(new Error('not found'));
    }
    return Promise.resolve(value);
};

Store.prototype._fetch = function _fetch(){
    return superagent.get(`${endpoint}${this.resource}`)
            .set(headers).then((result)=>{
                this.updateState(result.body);
                return Promise.resolve(this.state)
            }).catch((err)=>{
                return Promise.resolve(this.state);
            });
};
Store.prototype.updateState = function updateState(nextState = [], event){
    this.state = nextState;
    this.notifyChange(event);
}
Store.prototype.utils = utils;

module.exports = Store;
