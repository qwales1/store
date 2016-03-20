import {expect} from 'chai';
import sinon from 'sinon';
import Utils from '../../src/javascripts/stores/utils.js';
import deepFreeze from 'deep-freeze';
import moment from 'moment';

describe('Store Utils', ()=>{
    let list;
    beforeEach(()=>{
        list = require('../fixtures/store_list.json');
        deepFreeze(list);
    })
    it('should export object with required methods', () =>{
        expect(Utils).to.have.property('find');
        expect(Utils).to.have.property('update');
        expect(Utils).to.have.property('add');
        expect(Utils).to.have.property('remove');
    });
    describe('#find()', () => {
        it('return the first item that matches the query', (done)=>{
            let result = Utils.find(list, {id:3});
            expect(result).to.be.an.object;
            expect(result).to.have.property('id', 3);
            done();
        });
    });
    describe('#update()', () => {
        it('should return a new list with the update completed', (done)=>{
            let newObj = {
                id:3,
                name: "UPDATED_NAME",
                randomProp: "something",
                bool:0
            };
            let oldObj = {
                id:3,
                name: "thirdItem",
                randomProp: "something",
                bool:0
            };
            let result = Utils.update(list, newObj, oldObj);
            expect(result).to.be.an.array;
            expect(result).to.contain(newObj);
            done();
        });
    });
    describe('#add()', ()=>{
        it('should return a list with the new object', (done)=>{
            let newObj = {
                id:11,
                name: 'eleventhItem',
                randomProp:'something'
            }
            let result = Utils.add(list, newObj);
            expect(result).to.contain(newObj);
            expect(result[0]).to.equal(newObj);
            done();
        });
    });
    describe('#remove()', ()=>{
        it('should return a new list without the object', (done)=>{
            let obj = list[4];
            let result = Utils.remove(list,obj);
            expect(result).to.not.contain(obj);
            done();
        });
    });
    describe('#mysqlTime()', ()=>{
        it('should convert timestamp to MySQL timestamp', (done)=>{
            const mysqlTime = moment('2015-10-14T19:04:56.000Z').format('YYYY-MM-DD hh:mm:ss');
            let result = Utils.mysqlTime('2015-10-14T19:04:56.000Z');
            expect(result).to.equal(mysqlTime);
            done();
        });
    });

});
