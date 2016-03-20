import {expect} from 'chai';
import sinon from 'sinon';
import utils from '../utils/helpers';
import Promise from 'bluebird';
const root = '../../';
import nock from 'nock';

describe('Base Store', () => {
    var Store;
    var storeInstance;
    beforeEach(() => {
        Store = require(utils.rootPath(root,'/src/javascripts/stores/Base'));
        storeInstance = new Store();
    });
    it('should return an object when initialized', ()=>{
        Store = new Store();
        expect(storeInstance).to.be.an.Object;
    });
    describe('PUBLIC API', () => {
        describe('getState()', () => {
            it('should return the current state', (done)=>{
                var testArray = ['1','2','3'];
                var testInstance = storeInstance.extend({
                    state: testArray
                });
                testInstance.getState().then((result)=>{
                    expect(result).to.eql(testArray)
                    done();
                }).catch((err)=>{
                    done(err);
                });
            });
            it('should call _fetch if there is no state', (done)=>{
                var testArray = ['1','2','3'];
                var stub = sinon.stub(storeInstance, '_fetch', ()=>{
                    return Promise.resolve(testArray);
                });
                var testInstance = storeInstance.extend({
                    state:[]
                });
                testInstance.getState().then((result)=>{
                    expect(stub.calledOnce).to.eql(true);
                    expect(result).to.eql(testArray);
                    done()
                }).catch((err)=>{
                    done(err);
                });
            });
        });
        describe('getById()', () => {
            it('should return an item by the specified id', (done) => {
                var state = require('../fixtures/store_list.js');
                var testInstance = storeInstance.extend({
                    state: state,
                    resource:'/users',
                    idAttribute: 'id'
                });
                testInstance.getById(1).then((item) => {
                    expect(item).to.eql(state[0]);
                    done();
                }).catch((err)=>{
                    done(err);
                });
            });
            it('should reject if it cannot find the item', (done)=>{
                var state = require('../fixtures/store_list.js');
                var testInstance = storeInstance.extend({
                    state: state,
                    resource:'/users',
                    idAttribute: 'id'
                });
                testInstance.getById(100).then((item) => {
                    done('promise should reject');
                }).catch((err)=>{
                    done();
                });
            })
        });
        describe('save()', () => {
            it('should call parse()', (done) => {
                //mock server response
                var server = nock('http://beta.changecompanies.net')
                                .post('/webservices/users')
                                .reply(201,dummyData);
                
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users',
                    idAttribute: 'id',
                    model: {id:null,name:''}
                })
                var spy = sinon.spy(testInstance, 'parse');
                var dummyData = {
                    id:10,
                    name: 'A name'
                }
                var expectedCallback = () => {
                    expect(spy.calledOnce).to.eql(true);
                    done();
                }
                testInstance.addChangeListener(expectedCallback);
                testInstance.save(dummyData);
            })
            it('should add item to the state if new', (done) => {
                //mock server response
                var server = nock('http://beta.changecompanies.net')
                                .post('/webservices/users')
                                .reply(201,{
                                    id: 9999,
                                    name: 'Test User'
                                });
                var testInstance = storeInstance.extend({
                    idAttribute:'id',
                    resource: '/users',
                    state:[],
                    model: {id:null,name:''}
                });
                var testItem = {
                    name: 'Test User'
                }
                var expectedCallback = () => {
                    testInstance.getState().then((state)=>{
                        expect(state).includes({
                            name:'Test User',
                            id: 9999
                        })
                        done()
                    }).catch((err) => {
                        done(err);
                    })
                }
                testInstance.addChangeListener('save', expectedCallback);
                testInstance.save(testItem);
            });
            
            it('should update item in the state if it exists', (done) => {
                //mock server response
                var server = nock('http://beta.changecompanies.net')
                                .post('/webservices/users')
                                .reply(201, {name:'New Name', id:5});
                var originalState = [{id:5, name: 'Old Name'}]
                var testInstance = storeInstance.extend({
                    idAttribute:'id',
                    resource: '/users',
                    state: originalState,
                    model: {id:null,name:''}
                });
                var testItem = {
                    name: 'New Name',
                    id: 5
                }
                var expectedCallback = () => {
                    testInstance.getState().then((state)=>{
                        expect(state).includes({
                            name:'New Name',
                            id: 5
                        })
                        done();
                    }).catch((err) => {
                        done(err);
                    })
                }
                testInstance.addChangeListener('save', expectedCallback);
                testInstance.save(testItem, originalState[0]);
            });
        });
        describe('delete()', () => {
            it('should remove an item from the state', (done)=>{
                var server = nock('http://beta.changecompanies.net')
                             .delete(function(uri) {
                                return uri.indexOf('users') >= 0;
                            }).reply(200)
                var itemToDelete = {
                    id:77,
                    name: 'whatevs'
                }
                var testInstance = storeInstance.extend({
                    idAttribute: 'id',
                    resource: '/users',
                    model: {id:null,name:''},
                    state:[itemToDelete]
                });
                var expectedCallback = () => {
                    testInstance.getState().then((state) => {
                        expect(state).to.be.an.Array;
                        expect(state.length).to.eql(0);
                        done();
                    }).catch((err) => {
                        done(err);
                    });
                }
                testInstance.addChangeListener(expectedCallback);
                testInstance.delete(itemToDelete);
            });
            
        })
        describe('parse()', () => {
            it('should pull all the relevant values off an object based on the defaul model', () => {
                var defaultModel = () => {
                    return {
                        id: null,
                        name: '',
                        description:'',
                        image:''
                    }
                }
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users',
                    idAttribute:'id',
                    model: defaultModel()
                });
                var testData = {
                    id:1234,
                    name:'Test Name',
                    description: 'Something wicked awesome',
                    image: '/images/png.png',
                    someIrrelevantProperty: 'do not send me to server'
                }
                var result = testInstance.parse(testData);
                var resultKeys = Object.keys(result);
                expect(resultKeys).to.eql(Object.keys(defaultModel()));
            });
            it('should not include null or undefined values', () => {
                var defaultModel = () => {
                    return {
                        id: null,
                        name: '',
                        description:'',
                        image:''
                    };
                }
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users',
                    idAttribute:'id',
                    model: defaultModel()
                });
                var testData = {
                    id:1234,
                    name:'Test Name',
                    description: null,
                    image: undefined,
                };
                var result = testInstance.parse(testData);
                var resultKeys = Object.keys(result);
                expect(resultKeys).to.eql(['id','name']);
            });
        });
    });
    describe('INTERNALS', () => {
        describe('state property', () => {
            it('should be initialized as an empty array', ()=>{
                var testInstance = storeInstance.extend({
                    state:[]
                });
                expect(testInstance).to.have.property('state');
                expect(testInstance.state).to.be.an.Array;
                expect(testInstance.state.length).to.eql(0);
            });
            it('should be unique to each instance', ()=>{
                var otherStoreInstance = new Store();
                var testInstance = storeInstance.extend({
                    state:[]
                });
                var otherTestInstance = otherStoreInstance.extend({
                    state:[]
                });
                otherTestInstance.state.push('something');
                expect(testInstance.state).to.be.an.Array;
                expect(testInstance.state.length).to.eql(0);
                expect(otherTestInstance.state).to.be.an.Array;
                expect(otherTestInstance.state.length).to.eql(1);
            });
        });
        describe('_fetch()', () => {
            it('should make a get request to an api endpoint for the collection', (done) => {
                //mock server response
                var server = nock('http://beta.changecompanies.net')
                        .get('/webservices/users')
                        .reply(200, ['1','2','3']);
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users'
                });
                testInstance._fetch().then((result)=>{
                    expect(result).to.eql(['1','2','3'])
                    done();
                }).catch((err)=>{
                    done(err);
                });
            });
            it('should return an empty array for a 404', (done) => {
                //mock server response
                var server = nock('http://beta.changecompanies.net')
                                .get('/webservices/users')
                                .reply(404);
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users'
                });
                testInstance._fetch().then((result)=>{
                    expect(result).to.eql([])
                    done();
                }).catch((err)=>{
                    done(err);
                });
            });
        });
        describe('updateState()', ()=>{
            it('should modify the internal state array with the next state', (done) => {
                var testInstance = storeInstance.extend({
                    state:[],
                    resource:'/users'
                });
                const nextState = ['1','2','3'];
                testInstance.updateState(nextState, 'someEvent');
                testInstance.getState().then((result)=>{
                    expect(result).to.eql(nextState);
                    done();
                });
            });
            it('should allow call anonymous changeListener callbacks', ()=>{
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users'
                });
                const nextState = ['1','2','3'];
                var testCallback = sinon.spy();
                testInstance.addChangeListener(testCallback);
                testInstance.updateState(nextState);
                expect(testCallback.calledOnce).to.eql(true);
            });
            it('should allow call named changeListener callbacks', ()=>{
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users'
                });
                const nextState = ['1','2','3'];
                var testCallback = sinon.spy();
                testInstance.addChangeListener('someEvent', testCallback);
                testInstance.updateState(nextState, 'someEvent');
                expect(testCallback.calledOnce).to.eql(true);
            });
            it('should not call named changeListener callbacks when a different event is emitted', () => {
                var testInstance = storeInstance.extend({
                    state:[],
                    resource: '/users'
                });
                const nextState = ['1','2','3'];
                var testCallback = sinon.spy();
                var testOtherCallback = sinon.spy();
                testInstance.addChangeListener('someEvent', testCallback);
                testInstance.addChangeListener('someOtherEvent', testOtherCallback);
                testInstance.updateState(nextState, 'someEvent');
                expect(testCallback.calledOnce).to.eql(true);
                expect(testOtherCallback.calledOnce).to.eql(false);
            });
        });
        
    });
});
