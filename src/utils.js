import _ from 'lodash';
import moment from 'moment';
const StoreUtils = {
    find(list,map){
        return _.findWhere(list, map);
    },
    update(list, item, oldItem){
        let index = _.findIndex(list, (obj) => {
            return _.isEqual(obj,oldItem)
        });
        if(index !== -1){
            let newItem = _.extend({},item);
            let newList = [
                ...list.slice(0, index),
                newItem,
                ...list.slice(index+1)
            ];
            return newList;
        } else {
            return list;
        }
    },
    add(list,item){
        return [
            item,
            ...list
        ];
    },
    remove(list, item){
        let index = _.findIndex(list, (obj) => {
            return _.isEqual(obj,item)
        });
        return [
            ...list.slice(0,index),
            ...list.slice(index+1)
        ];
    },
    mysqlTime(time){
        return moment(time).format('YYYY-MM-DD hh:mm:ss');
    }
}
module.exports = StoreUtils;
