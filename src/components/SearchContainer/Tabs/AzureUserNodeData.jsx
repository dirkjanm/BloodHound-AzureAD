import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import CollapsibleSection from './Components/CollapsibleSection';
import NodeCypherLinkComplex from './Components/NodeCypherLinkComplex';
import NodeCypherLink from './Components/NodeCypherLink';
import NodeCypherNoNumberLink from './Components/NodeCypherNoNumberLink';
import MappedNodeProps from './Components/MappedNodeProps';
import ExtraNodeProps from './Components/ExtraNodeProps';
import NodePlayCypherLink from './Components/NodePlayCypherLink';
import Notes from './Components/Notes';
import { withAlert } from 'react-alert';
import NodeGallery from './Components/NodeGallery';

const AzureUserNodeData = () => {
    const [visible, setVisible] = useState(false);
    const [objectId, setObjectId] = useState(null);
    const [label, setLabel] = useState(null);
    const [domain, setDomain] = useState(null);
    const [nodeProps, setNodeProps] = useState({});

    useEffect(() => {
        emitter.on('nodeClicked', nodeClickEvent);

        return () => {
            emitter.removeListener('nodeClicked', nodeClickEvent);
        };
    }, []);

    const nodeClickEvent = (type, id, blocksinheritance, domain) => {
        if (type === 'AzureUser') {
            setVisible(true);
            setObjectId(id);
            setDomain(domain);
            let session = driver.session();
            session
                .run(`MATCH (n:${type} {objectid: $objectid}) RETURN n AS node`, {
                    objectid: id
                })
                .then(r => {
                    let props = r.records[0].get('node').properties;
                    setNodeProps(props);
                    setLabel(props.displayname || objectid);
                    session.close();
                });
        } else {
            setObjectId(null);
            setVisible(false);
        }
    };

    const displayMap = {
        displayname: 'Display Name',
        objectid: 'Object ID',
        pwdlastset: 'Password Last Changed',
        lastlogon: 'Last Logon',
        lastlogontimestamp: 'Last Logon (Replicated)',
        enabled: 'Enabled',
        email: 'Email',
        title: 'Title',
        homedirectory: 'Home Directory',
        description: 'Description',
        userpassword: 'User Password',
        admincount: 'AdminCount',
        owned: 'Compromised',
        pwdneverexpires: 'Password Never Expires',
        sensitive: 'Cannot Be Delegated',
        dontreqpreauth: 'ASREP Roastable',
        serviceprincipalnames: 'Service Principal Names',
        allowedtodelegate: 'Allowed To Delegate',
        sidhistory: 'SID History',
    };

    return objectId === null ? (
        <div></div>
    ) : (
        <div className={clsx(!visible && 'displaynone')}>
            <dl className={'dl-horizontal'}>
                <h4>{label || objectId}</h4>
                <NodeCypherLink
                    property='Sessions'
                    target={objectId}
                    baseQuery={
                        'MATCH p=(m:Computer)-[r:HasSession]->(n:User {objectid: $objectid})'
                    }
                    end={label}
                />

                <NodeCypherLinkComplex
                    property='Sibling Objects in the Same OU'
                    target={objectId}
                    countQuery={
                        'MATCH (o1)-[r1:Contains]->(o2:User {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN count(distinct(n))'
                    }
                    graphQuery={
                        'MATCH (o1)-[r1:Contains]->(o2:User {objectid: $objectid}) WITH o1 OPTIONAL MATCH p1=(d)-[r2:Contains*1..]->(o1) OPTIONAL MATCH p2=(o1)-[r3:Contains]->(n) WHERE n:User OR n:Computer RETURN p1,p2'
                    }
                />

                <NodeCypherLink
                    property='Reachable High Value Targets'
                    target={objectId}
                    baseQuery={
                        'MATCH (m:AzureUser {objectid: $objectid}),(n {highvalue:true}),p=shortestPath((m)-[r*1..]->(n)) WHERE NONE (r IN relationships(p) WHERE type(r)= "GetChanges") AND NONE (r in relationships(p) WHERE type(r)="GetChangesAll") AND NOT m=n'
                    }
                    start={label}
                />

                <NodeCypherLinkComplex
                    property='Effective Inbound GPOs'
                    target={objectId}
                    countQuery={
                        'MATCH (c:User {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) WITH COLLECT(g1) + COLLECT(g2) AS tempVar UNWIND tempVar AS GPOs RETURN COUNT(DISTINCT(GPOs))'
                    }
                    graphQuery={
                        'MATCH (c:User {objectid: $objectid}) OPTIONAL MATCH p1 = (g1:GPO)-[r1:GpLink {enforced:true}]->(container1)-[r2:Contains*1..]->(c) OPTIONAL MATCH p2 = (g2:GPO)-[r3:GpLink {enforced:false}]->(container2)-[r4:Contains*1..]->(c) WHERE NONE (x in NODES(p2) WHERE x.blocksinheritance = true AND x:OU AND NOT (g2)-->(x)) RETURN p1,p2'
                    }
                />

                <NodeCypherNoNumberLink
                    target={objectId}
                    property='See user within Domain/OU Tree'
                    query='MATCH p = (d:Domain)-[r:Contains*1..]->(u:User {objectid: $objectid}) RETURN p'
                />
                <MappedNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />
                <ExtraNodeProps
                    displayMap={displayMap}
                    properties={nodeProps}
                    label={label}
                />

                <CollapsibleSection header={'Group Membership'}>
                    <NodeCypherLink
                        property='First Degree Group Memberships'
                        target={objectId}
                        baseQuery={
                            'MATCH (m:AzureUser {objectid: $objectid}), (n:AzureGroup), p=(m)-[:MemberOf]->(n)'
                        }
                        start={label}
                    />

                    <NodeCypherLink
                        property='Unrolled Group Membership'
                        target={objectId}
                        baseQuery={
                            'MATCH p = (m:AzureUser {objectid: $objectid})-[r:MemberOf*1..]->(n:AzureGroup)'
                        }
                        start={label}
                        distinct
                    />

                </CollapsibleSection>

                <CollapsibleSection header={'Role Membership'}>
                    <NodeCypherLink
                        property='First Degree Role Memberships'
                        target={objectId}
                        baseQuery={
                            'MATCH (m:AzureUser {objectid: $objectid}), (n:AzureRole), p=(m)-[:MemberOf]->(n)'
                        }
                        start={label}
                    />

                </CollapsibleSection>

                <CollapsibleSection header={'Local Admin Rights'}>
                    <NodeCypherLink
                        property='First Degree Local Admin'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(m:AzureUser {objectid: $objectid})-[r:AdminTo]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Local Admin Rights'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(m:AzureUser {objectid: $objectid})-[r1:MemberOf*1..]->(g:Group)-[r2:AdminTo]->(n:Computer)'
                        }
                        start={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Derivative Local Admin Rights'
                        target={objectId}
                        baseQuery={
                            'MATCH p=shortestPath((m:AzureUser {objectid: $objectid})-[r:HasSession|AdminTo|MemberOf*1..]->(n:Computer))'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>

                <CollapsibleSection header={'Outbound Object Control'}>
                    <NodeCypherLink
                        property='First Degree Object Control'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(u:AzureUser {objectid: $objectid})-[r1]->(n) WHERE r1.isacl=true'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Owned Service Principals'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(u:AzureUser {objectid: $objectid})-[r1:Owns*1..]->(n:ServicePrincipal)'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Group Delegated Object Control'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(u:AzureUser {objectid: $objectid})-[r1:MemberOf*1..]->(g:AzureGroup)-[r2]->(n) WHERE r2.isacl=true'
                        }
                        start={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Control'
                        target={objectId}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.objectid=$objectid MATCH p=shortestPath((u:AzureUser {objectid: $objectid})-[r1:MemberOf|AddMember|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns*1..]->(n))'
                        }
                        start={label}
                        distinct
                    />
                </CollapsibleSection>

                <CollapsibleSection header={'Inbound Object Control'}>
                    <NodeCypherLink
                        property='Explicit Object Controllers'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(n)-[r]->(u1:User {objectid: $objectid}) WHERE r.isacl=true'
                        }
                        end={label}
                        distinct
                    />

                    <NodeCypherLink
                        property='Unrolled Object Controllers'
                        target={objectId}
                        baseQuery={
                            'MATCH p=(n)-[r:MemberOf*1..]->(g:Group)-[r1:AddMember|AllExtendedRights|GenericAll|GenericWrite|WriteDacl|WriteOwner|Owns]->(u:User {objectid: $objectid}) WITH LENGTH(p) as pathLength, p, n WHERE NONE (x in NODES(p)[1..(pathLength-1)] WHERE x.objectid = u.objectid) AND NOT n.objectid = u.objectid'
                        }
                        end={label}
                        distinct
                    />

                    <NodePlayCypherLink
                        property='Transitive Object Controllers'
                        target={objectId}
                        baseQuery={
                            'MATCH (n) WHERE NOT n.objectid=$objectid MATCH p = shortestPath((n)-[r1:MemberOf|AllExtendedRights|ForceChangePassword|GenericAll|GenericWrite|WriteDacl|WriteOwner*1..]->(u1:User {objectid: $objectid}))'
                        }
                        end={label}
                        distinct
                    />
                </CollapsibleSection>
                <Notes objectid={objectId} type={'AzureUser'} />
                <NodeGallery
                    objectid={objectId}
                    type={'AzureUser'}
                    visible={visible}
                />
            </dl>
        </div>
    );
};

AzureUserNodeData.propTypes = {};
export default withAlert()(AzureUserNodeData);
